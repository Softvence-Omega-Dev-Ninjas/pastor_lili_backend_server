#!/usr/bin/env bash
set -euo pipefail
# ===============================================
# 🎯 setup-ci-cd.sh
# Generic GitHub Actions CI/CD setup for Sabbir’s projects
# ===============================================

ENV_FILE=".env.production"
WORKFLOW_DIR=".github/workflows"
ACTIONS_DIR=".github/actions"

# --- Auto-detect repo from git remote origin ---
get_repo_name() {
  git config --get remote.origin.url | sed -E 's/.*github\.com[:/](.*)\.git/\1/'
}

# --- Validate .env.production existence ---
validate_env_file() {
  if [[ ! -f "$ENV_FILE" ]]; then
    echo "❌ Missing ${ENV_FILE} file!"
    exit 1
  fi
}

# --- Push all env vars to GitHub Secrets dynamically ---
push_env_to_github() {
  local repo
  repo=$(get_repo_name)
  echo "🔐 Syncing all secrets from ${ENV_FILE} → GitHub repo: ${repo}"

  while IFS='=' read -r key value || [[ -n "$key" ]]; do
    [[ -z "$key" || "$key" == \#* ]] && continue
    key=$(echo "$key" | tr -d ' ')
    value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//')
    echo "→ Setting secret: $key"
    gh secret set "$key" -b"$value"
  done < "$ENV_FILE"

  echo "✅ Secrets synced successfully!"
}

# --- Generate reusable composite GitHub Actions ---
generate_composite_actions() {
  echo "⚙️ Creating composite GitHub actions..."

  mkdir -p "${ACTIONS_DIR}/docker-login" \
           "${ACTIONS_DIR}/docker-build" \
           "${ACTIONS_DIR}/deploy"

  # --- docker-login/action.yaml ---
  cat > "${ACTIONS_DIR}/docker-login/action.yaml" <<'YAML'
name: "Docker Login"
description: "Authenticate to Docker Hub"
runs:
  using: "composite"
  steps:
    - name: Log in to Docker Hub
      shell: bash
      run: |
        echo "${{ secrets.DOCKER_PASSWORD }}" | docker login -u "${{ secrets.DOCKER_USERNAME }}" --password-stdin
YAML

  # --- docker-build/action.yaml ---
  cat > "${ACTIONS_DIR}/docker-build/action.yaml" <<'YAML'
name: "Docker Build & Push"
description: "Build and push Docker image"
runs:
  using: "composite"
  steps:
    - name: Build and push Docker image
      shell: bash
      run: |
        IMAGE_NAME=${{ secrets.DOCKER_USERNAME }}/${{ github.repository }}
        docker build -t $IMAGE_NAME:latest .
        docker push $IMAGE_NAME:latest
YAML

  # --- deploy/action.yaml ---
  cat > "${ACTIONS_DIR}/deploy/action.yaml" <<'YAML'
name: "Deploy to VPS"
description: "Deploy the application to VPS using deploy.sh"
runs:
  using: "composite"
  steps:
    - name: Deploy on VPS
      shell: bash
      run: |
        echo "${{ secrets.VPS_SSH_KEY }}" > vps-key.pem
        chmod 600 vps-key.pem
        ssh -i vps-key.pem -o StrictHostKeyChecking=no ${{ secrets.VPS_USER }}@${{ secrets.VPS_HOST }} 'bash -s' < ./deploy.sh
YAML

  echo "✅ Composite actions created successfully!"
}

# --- Generate CI Workflow ---
generate_ci_workflow() {
  mkdir -p "$WORKFLOW_DIR"
  cat > "${WORKFLOW_DIR}/ci.yaml" <<'YAML'
name: CI Workflow

on:
  push:
    branches-ignore:
      - dev
      - main

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
YAML
  echo "✅ CI workflow created at ${WORKFLOW_DIR}/ci.yaml"
}

# --- Generate CD Workflow ---
generate_cd_workflow() {
  mkdir -p "$WORKFLOW_DIR"
  cat > "${WORKFLOW_DIR}/cd.yaml" <<'YAML'
name: CD Workflow

on:
  push:
    branches:
      - dev
      - main

jobs:
  docker-build:
    if: github.ref_name == 'dev'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/docker-login
      - uses: ./.github/actions/docker-build

  deploy:
    if: github.ref_name == 'main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/deploy
YAML
  echo "✅ CD workflow created at ${WORKFLOW_DIR}/cd.yaml"
}

# --- Main Execution Flow ---
validate_env_file
push_env_to_github
generate_composite_actions
generate_ci_workflow
generate_cd_workflow

echo "🎉 CI/CD structure generated successfully for repo: $(get_repo_name)"

