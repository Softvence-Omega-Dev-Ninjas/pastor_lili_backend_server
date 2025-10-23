#!/usr/bin/env bash
set -eo pipefail

# -------------------------
# Configuration
# -------------------------
ENV_FILE=".env.production"
ACTIONS_DIR=".github/actions"
CI_YAML=".github/workflows/ci.yaml"
CD_YAML=".github/workflows/cd.yaml"

# Colors for output
readonly GREEN="\033[0;32m"
readonly YELLOW="\033[1;33m"
readonly RED="\033[0;31m"
readonly BLUE="\033[0;34m"
readonly RESET="\033[0m"

# -------------------------
# Helper Functions
# -------------------------
err() { echo -e "${RED}❌ $*${RESET}" >&2; }
info() { echo -e "${BLUE}ℹ️  $*${RESET}"; }
ok() { echo -e "${GREEN}✅ $*${RESET}"; }
warn() { echo -e "${YELLOW}⚠️  $*${RESET}"; }

# -------------------------
# Sanity Checks
# -------------------------
[[ -f "$ENV_FILE" ]] || { err "$ENV_FILE not found!"; exit 1; }
command -v node >/dev/null 2>&1 || { err "Node.js required but not found!"; exit 1; }
command -v gh >/dev/null 2>&1 || { err "GitHub CLI (gh) required! Install from: https://cli.github.com/"; exit 1; }

if ! gh auth status >/dev/null 2>&1; then
  err "GitHub CLI not authenticated! Run: gh auth login"
  exit 1
fi

# -------------------------
# Extract Dynamic Values
# -------------------------
PACKAGE_NAME="$(node -pe "try{require('./package.json').name||'app'}catch{process.exit(1)}")" || { err "Failed to read package.json"; exit 1; }
PACKAGE_VERSION="$(node -pe "try{require('./package.json').version||'0.0.1'}catch{process.exit(1)}")" || PACKAGE_VERSION="0.0.1"

info "Package: $PACKAGE_NAME, Version: $PACKAGE_VERSION"

# -------------------------
# Read .env (macOS Bash 3.2 compatible)
# -------------------------
ENV_KEYS=()
ENV_VALUES=()

while IFS= read -r line || [[ -n "$line" ]]; do
  [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
  if [[ "$line" =~ ^([A-Z_][A-Z0-9_]*)=(.*)$ ]]; then
    key="${BASH_REMATCH[1]}"
    value="${BASH_REMATCH[2]}"
    value="${value%\"}"; value="${value#\"}"
    value="${value%\'}"; value="${value#\'}"
    ENV_KEYS+=("$key")
    ENV_VALUES+=("$value")
  fi
done < "$ENV_FILE"

info "Found ${#ENV_KEYS[@]} environment variables"

# -------------------------
# Upload Secrets to GitHub
# -------------------------
upload_secrets_to_github() {
  info "Uploading secrets to GitHub..."
  local success_count=0
  local fail_count=0

  for ((i=0; i<${#ENV_KEYS[@]}; i++)); do
    key="${ENV_KEYS[$i]}"
    value="${ENV_VALUES[$i]}"

    if [[ -z "$value" ]]; then
      warn "Skipping $key (empty value)"
      continue
    fi

    echo -ne "  Setting ${BLUE}${key}${RESET}... "
    if echo "$value" | gh secret set "$key" >/dev/null 2>&1; then
      echo -e "${GREEN}✓${RESET}"
      ((success_count++))
    else
      echo -e "${RED}✗${RESET}"
      ((fail_count++))
    fi
  done

  echo ""
  ok "Uploaded $success_count secrets successfully"
  [[ $fail_count -gt 0 ]] && warn "$fail_count secrets failed to upload"
}

# -------------------------
# Generate setup-and-load-env
# -------------------------
generate_setup_env_action() {
  local file="$ACTIONS_DIR/setup-and-load-env/action.yaml"
  info "Generating setup-and-load-env action..."
  mkdir -p "$(dirname "$file")"

  {
    cat <<EOF
name: "setup-and-load-env"
description: "Setup and load environment variables"
inputs:
EOF
    for ((i=0; i<${#ENV_KEYS[@]}; i++)); do
      key="${ENV_KEYS[$i]}"
      echo "  $key:"
      echo "    description: \"$key from environment\""
      echo "    required: true"
    done
    cat <<'EOF'
runs:
  using: "composite"
  steps:
    - name: Generate .env
      shell: bash
      run: |
        ENV_FILE="$GITHUB_WORKSPACE/.env"
        {
EOF
    for ((i=0; i<${#ENV_KEYS[@]}; i++)); do
      key="${ENV_KEYS[$i]}"
      echo "          echo \"$key=\${{ inputs.$key }}\""
    done
    cat <<'EOF'
        } > "$ENV_FILE"
        if [[ -n "${{ inputs.VPS_SSH_PRIVATE_KEY }}" ]]; then
          echo "${{ inputs.VPS_SSH_PRIVATE_KEY }}" > "$GITHUB_WORKSPACE/deploy_key.pem"
          chmod 600 "$GITHUB_WORKSPACE/deploy_key.pem"
          echo "VPS_SSH_PRIVATE_KEY_FILE=$GITHUB_WORKSPACE/deploy_key.pem" >> "$ENV_FILE"
        fi
        echo "✅ Environment file created"
EOF
  } > "$file"
  ok "Generated setup-and-load-env action"
}

# -------------------------
# Docker Login Action
# -------------------------
generate_docker_login_action() {
  local file="$ACTIONS_DIR/docker-login/action.yaml"
  info "Generating docker-login action..."
  mkdir -p "$(dirname "$file")"
  cat > "$file" <<'EOF'
name: "docker-login"
description: "Docker login composite action"
inputs:
  DOCKER_USERNAME:
    required: true
  SE_DOCKER_PASSWORD:
    required: true
runs:
  using: "composite"
  steps:
    - name: Log in to Docker Hub
      shell: bash
      run: |
        echo "${{ inputs.SE_DOCKER_PASSWORD }}" | docker login -u "${{ inputs.DOCKER_USERNAME }}" --password-stdin
        echo "✅ Docker login successful"
EOF
  ok "Generated docker-login action"
}

# -------------------------
# SSH Setup Action
# -------------------------
generate_setup_ssh_action() {
  local file="$ACTIONS_DIR/setup-ssh/action.yaml"
  info "Generating setup-ssh action..."
  mkdir -p "$(dirname "$file")"
  cat > "$file" <<'EOF'
name: "setup-ssh"
description: "Setup SSH for deployment"
inputs:
  VPS_USER:
    required: true
  VPS_HOST:
    required: true
  VPS_SSH_PRIVATE_KEY:
    required: true
runs:
  using: "composite"
  steps:
    - name: Setup SSH
      shell: bash
      run: |
        mkdir -p ~/.ssh && chmod 700 ~/.ssh
        echo "${{ inputs.VPS_SSH_PRIVATE_KEY }}" | tr -d '\r' > ~/.ssh/deploy_key
        chmod 600 ~/.ssh/deploy_key
        ssh-keyscan -H ${{ inputs.VPS_HOST }} >> ~/.ssh/known_hosts
        chmod 644 ~/.ssh/known_hosts
        cat > ~/.ssh/config <<SSHEOF
        Host deploy-server
          HostName ${{ inputs.VPS_HOST }}
          User ${{ inputs.VPS_USER }}
          IdentityFile ~/.ssh/deploy_key
          StrictHostKeyChecking no
        SSHEOF
        chmod 600 ~/.ssh/config
        echo "✅ SSH configured"
        
    - name: Test SSH Connection
      shell: bash
      run: ssh deploy-server "echo '🎉 SSH Connected successfully!'"
EOF
  ok "Generated setup-ssh action"
}

# -------------------------
# Verify Env Action
# -------------------------
generate_verify_env_action() {
  local file="$ACTIONS_DIR/verify-env/action.yaml"
  info "Generating verify-env action..."
  mkdir -p "$(dirname "$file")"
  cat > "$file" <<'EOF'
name: "verify-env"
description: "Verify environment variables"
inputs:
  PACKAGE_NAME:
    required: true
  PACKAGE_VERSION:
    required: true
  IMAGE_TAG:
    required: true
runs:
  using: "composite"
  steps:
    - name: Verify Environment
      shell: bash
      run: |
        echo "📦 Package: ${{ inputs.PACKAGE_NAME }}"
        echo "🏷️  Version: ${{ inputs.PACKAGE_VERSION }}"
        echo "🐳 Image: ${{ inputs.IMAGE_TAG }}"
        echo "✅ Environment variables verified"
EOF
  ok "Generated verify-env action"
}

# -------------------------
# Workflow Input Generator
# -------------------------
generate_workflow_inputs() {
  for ((i=0; i<${#ENV_KEYS[@]}; i++)); do
    key="${ENV_KEYS[$i]}"
    echo "          $key: \${{ secrets.$key }}"
  done
}

# -------------------------
# CI Workflow
# -------------------------
generate_ci_workflow() {
  info "Generating CI workflow..."
  mkdir -p "$(dirname "$CI_YAML")"

  {
    cat <<'EOF'
name: CI Pipeline
on:
  push:
    branches: ["**"]
  pull_request:
    branches: ["**"]

jobs:
  lint-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Environment
        uses: ./.github/actions/setup-and-load-env
        with:
EOF
    generate_workflow_inputs
    cat <<'EOF'
      - uses: ./.github/actions/verify-env
        with:
          PACKAGE_NAME: ${{ secrets.PACKAGE_NAME }}
          PACKAGE_VERSION: ${{ secrets.PACKAGE_VERSION }}
          IMAGE_TAG: ${{ secrets.IMAGE_TAG }}
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - uses: pnpm/action-setup@v2
        with:
          version: 10
      - uses: actions/cache@v3
        with:
          path: ~/.pnpm-store
          key: ${{ runner.os }}-pnpm-${{ hashFiles('**/pnpm-lock.yaml') }}
          restore-keys: |
            ${{ runner.os }}-pnpm-
      - run: pnpm install
      - run: pnpm ci:fix
      - run: pnpm format
      - run: pnpm prisma:generate
      - run: pnpm build
      - name: Cleanup
        if: always()
        run: rm -f "${{ github.workspace }}/.env"

  build-and-push:
    needs: lint-test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Environment
        uses: ./.github/actions/setup-and-load-env
        with:
EOF
    generate_workflow_inputs
    cat <<'EOF'
      - uses: ./.github/actions/verify-env
        with:
          PACKAGE_NAME: ${{ secrets.PACKAGE_NAME }}
          PACKAGE_VERSION: ${{ secrets.PACKAGE_VERSION }}
          IMAGE_TAG: ${{ secrets.IMAGE_TAG }}
      - uses: ./.github/actions/docker-login
        with:
          DOCKER_USERNAME: ${{ secrets.DOCKER_USERNAME }}
          SE_DOCKER_PASSWORD: ${{ secrets.SE_DOCKER_PASSWORD }}
      - name: Build Docker Image
        run: docker compose --profile prod build
      - name: Push Docker Image
        run: docker compose --profile prod push
      - name: Cleanup
        if: always()
        run: rm -f "${{ github.workspace }}/.env"
EOF
  } > "$CI_YAML"
  ok "Generated CI workflow"
}

# -------------------------
# CD Workflow
# -------------------------
generate_cd_workflow() {
  info "Generating CD workflow..."
  mkdir -p "$(dirname "$CD_YAML")"

  {
    cat <<'EOF'
name: CD Pipeline
on:
  workflow_run:
    workflows: ["CI Pipeline"]
    types: [completed]

jobs:
  deploy:
    runs-on: ubuntu-latest
    if: ${{ github.event.workflow_run.conclusion == 'success' && github.event.workflow_run.head_branch == 'main' }}
    steps:
      - uses: actions/checkout@v4
      - name: Setup Environment
        uses: ./.github/actions/setup-and-load-env
        with:
EOF
    generate_workflow_inputs
    cat <<'EOF'
      - uses: ./.github/actions/setup-ssh
        with:
          VPS_USER: ${{ secrets.VPS_USER }}
          VPS_HOST: ${{ secrets.VPS_HOST }}
          VPS_SSH_PRIVATE_KEY: ${{ secrets.VPS_SSH_PRIVATE_KEY }}
      - name: Deploy Application 🚀
        run: |
          ssh deploy-server "echo 'Deploying ${{ secrets.PACKAGE_NAME }} version ${{ secrets.PACKAGE_VERSION }}'"
EOF
  } > "$CD_YAML"
  ok "Generated CD workflow"
}

# -------------------------
# Main
# -------------------------
main() {
  echo ""
  echo "============================================"
  echo "   🚀 GitHub Workflow Generator"
  echo "============================================"
  echo ""

  upload_secrets_to_github
  echo ""
  info "Generating GitHub Actions workflows..."
  echo ""

  generate_setup_env_action
  generate_docker_login_action
  generate_setup_ssh_action
  generate_verify_env_action
  generate_ci_workflow
  generate_cd_workflow

  echo ""
  echo "============================================"
  ok "🎉 All files generated successfully!"
  echo "============================================"
  echo ""
}

main "$@"

