#!/bin/bash
set -euo pipefail

# ================================
# Configurable
# ================================
PACKAGE_NAME="${PACKAGE_NAME:?PACKAGE_NAME not set}"
DOCKER_USERNAME="${DOCKER_USERNAME:?DOCKER_USERNAME not set}"
PACKAGE_VERSION="${PACKAGE_VERSION:-latest}"
PORT="${PORT:-5056}"
VPS_HOST_IP="${VPS_HOST_IP:?VPS_HOST_IP not set}"
VERSION_FILE="./deployment_versions.txt"

BASE_URL="http://$VPS_HOST_IP"
LIVE_ENDPOINT="${BASE_URL}:${PORT}/api/health"
CANDIDATE_PORT=$((PORT + 1))
CANDIDATE_ENDPOINT="${BASE_URL}:${CANDIDATE_PORT}/api/health"

HEALTH_TIMEOUT=8
HEALTH_RETRIES=5

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
log(){ echo -e "${BLUE}[INFO]${NC} $*"; }
ok(){ echo -e "${GREEN}[OK]${NC} $*"; }
warn(){ echo -e "${YELLOW}[WARN]${NC} $*"; }
err(){ echo -e "${RED}[ERR]${NC} $*"; }

# ================================
# Version Helpers
# ================================
current_version(){ [ -f "$VERSION_FILE" ] && tail -n1 "$VERSION_FILE" || echo "none"; }
previous_version(){ [ -f "$VERSION_FILE" ] && tail -n2 "$VERSION_FILE" | head -n1 || echo "none"; }
save_version(){ echo "$1" >> "$VERSION_FILE"; tail -n 10 "$VERSION_FILE" > "${VERSION_FILE}.tmp" && mv "${VERSION_FILE}.tmp" "$VERSION_FILE"; }

# ================================
# Health check
# ================================
check_health(){
  local url="$1"
  log "Checking health at $url ..."
  for i in $(seq 1 $HEALTH_RETRIES); do
    if curl -fs --max-time $HEALTH_TIMEOUT "$url" | grep -q '"status":"ok"'; then
      ok "Health check passed"
      return 0
    fi
    warn "Attempt $i/$HEALTH_RETRIES failed"
    sleep 5
  done
  return 1
}

# ================================
# Deployment
# ================================
deploy(){
  local version="$1"
  local image="${DOCKER_USERNAME}/${PACKAGE_NAME}:${version}"

  log "Pulling new image: $image"
  docker pull "$image" || err "Failed to pull image"

  log "Starting candidate container on port $CANDIDATE_PORT ..."
  docker run -d \
    --name "${PACKAGE_NAME}_candidate" \
    -p "${CANDIDATE_PORT}:${PORT}" \
    "$image" >/dev/null

  sleep 5

  if check_health "$CANDIDATE_ENDPOINT"; then
    ok "New version $version is healthy ✅"
    save_version "$version"

    log "Stopping old container..."
    docker rm -f "${PACKAGE_NAME}_live" >/dev/null 2>&1 || true

    log "Promoting candidate → live..."
    docker rename "${PACKAGE_NAME}_candidate" "${PACKAGE_NAME}_live"
    ok "Deployment complete. Now serving version $version"
  else
    err "New version failed health check ❌"
    docker rm -f "${PACKAGE_NAME}_candidate" >/dev/null 2>&1 || true

    prev=$(previous_version)
    if [ "$prev" != "none" ]; then
      warn "Rolling back to previous version: $prev"
      deploy "$prev"
    else
      err "No previous version to roll back to!"
    fi
  fi
}

rollback(){
  local prev=$(previous_version)
  [ "$prev" = "none" ] && { err "No previous version"; return 1; }
  log "Rolling back to $prev ..."
  deploy "$prev"
}

status(){
  echo "=== Deployment Status ==="
  echo "Current: $(current_version)"
  echo "Previous: $(previous_version)"
  docker ps --filter "name=${PACKAGE_NAME}" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
  echo
  if curl -fs "$LIVE_ENDPOINT" | grep -q '"status":"ok"'; then
    ok "Current live version is healthy"
  else
    err "Current live version unhealthy"
  fi
}

# ================================
# CLI
# ================================
case "${1:-}" in
  --version)
    [ -z "${2:-}" ] && { echo "Usage: $0 --version <version>"; exit 1; }
    deploy "$2"
    ;;
  --rollback)
    rollback
    ;;
  status)
    status
    ;;
  *)
    echo "Usage: $0 --version <version> | --rollback | status"
    ;;
esac
