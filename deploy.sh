#!/usr/bin/env bash
#
# Build the site and deploy it to Infomaniak via SFTP.
#
# Usage:
#   1. cp .env.deploy .env.deploy
#   2. Fill in your credentials in .env.deploy
#   3. ./deploy.sh        (full deploy: build + upload)
#      ./deploy.sh --skip-build   (upload existing dist/ only)
#
# Requirements: lftp (brew install lftp)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/.env.deploy"
DIST_DIR="${SCRIPT_DIR}/dist"

SKIP_BUILD=0
for arg in "$@"; do
  case "$arg" in
    --skip-build) SKIP_BUILD=1 ;;
    *) echo "Unknown argument: $arg" >&2; exit 1 ;;
  esac
done

if [[ ! -f "$ENV_FILE" ]]; then
  echo "✗ $ENV_FILE not found." >&2
  echo "  Copy .env.deploy.example to .env.deploy and fill in your credentials." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

: "${SFTP_HOST:?SFTP_HOST is required in .env.deploy}"
: "${SFTP_USER:?SFTP_USER is required in .env.deploy}"
: "${SFTP_PASSWORD:?SFTP_PASSWORD is required in .env.deploy}"
: "${SFTP_REMOTE_DIR:?SFTP_REMOTE_DIR is required in .env.deploy}"
SFTP_PORT="${SFTP_PORT:-22}"

if ! command -v lftp >/dev/null 2>&1; then
  echo "✗ lftp is not installed." >&2
  echo "  Install with: brew install lftp" >&2
  exit 1
fi

if [[ "$SKIP_BUILD" -eq 0 ]]; then
  echo "→ Building production bundle…"
  npm run build
fi

if [[ ! -d "$DIST_DIR" ]]; then
  echo "✗ $DIST_DIR not found. Run without --skip-build first." >&2
  exit 1
fi

echo "→ Uploading dist/ to ${SFTP_USER}@${SFTP_HOST}:${SFTP_REMOTE_DIR} (port ${SFTP_PORT})…"

lftp -c "
set sftp:auto-confirm yes;
set ftp:ssl-allow no;
set net:max-retries 2;
set net:timeout 15;
open -u '${SFTP_USER}','${SFTP_PASSWORD}' -p ${SFTP_PORT} sftp://${SFTP_HOST};
mirror -R --delete --verbose --exclude-glob .DS_Store '${DIST_DIR}/' '${SFTP_REMOTE_DIR}';
bye;
"

echo "✓ Deployed to https://${SFTP_HOST%%.*}… (replace with your actual domain)"
