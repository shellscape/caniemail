#!/bin/bash
set -euo pipefail

TEMP_FILE=$(mktemp)
curl -s https://www.caniemail.com/api/data.json > "$TEMP_FILE"

# We'll let this go through brcause we're creating a PR now
# API_VERSION=$(jq -r '.api_version' "$TEMP_FILE")
# if [[ ! $API_VERSION =~ ^1\. ]]; then
#   echo "The API Version has changed. Aborting"
#   rm "$TEMP_FILE"
#   exit 1
# fi

parse_date() {
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS date command
    date -j -f "%Y-%m-%dT%H:%M:%S" "$1" +%s 2>/dev/null || date -j -f "%Y-%m-%d %H:%M:%S" "$1" +%s 2>/dev/null || date -j -f "%Y-%m-%d" "$1" +%s
  else
    # GNU date (Linux)
    date -u -d "$1" +%s
  fi
}

create_pr() {
  local fromBranch="$1"
  local api="https://api.github.com/repos/${GITHUB_REPOSITORY}"

  local payload
  payload=$(jq -n \
    --arg title "chore: update caniemail.json" \
    --arg head "${fromBranch}" \
    --arg base "main" \
    --arg body "This PR was created automatically." \
    '{title:$title, head:$head, base:$base, body:$body}')

  local resp
  resp=$(curl -sS -X POST \
    -H "Authorization: Bearer ${GITHUB_TOKEN}" \
    -H "Accept: application/vnd.github+json" \
    -d "$payload" \
    "${api}/pulls")

  echo "$resp"
}

REMOTE_DATE=$(jq -r '.last_update_date' "$TEMP_FILE")
LOCAL_DATE=$(jq -r '.last_update_date' data/caniemail.json)
REMOTE_TIMESTAMP=$(parse_date "$REMOTE_DATE")
LOCAL_TIMESTAMP=$(parse_date "$LOCAL_DATE")
branchName=chore/data-update/$REMOTE_TIMESTAMP

echo "Remote Date: $REMOTE_DATE, Local Date: $LOCAL_DATE"

if [ "$REMOTE_TIMESTAMP" -gt "$LOCAL_TIMESTAMP" ]; then
  echo "Creating PR For New Data: $branchName"

  cp "$TEMP_FILE" data/caniemail.json
  git checkout -b $branchName
  pnpm test -- --u
  git add .
  git commit -m "chore: update caniemail.json"
  git push

  create_pr "$branchName"
fi

rm "$TEMP_FILE"
