#!/bin/bash

TEMP_FILE=$(mktemp)
curl -s https://www.caniemail.com/api/data.json > "$TEMP_FILE"

API_VERSION=$(jq -r '.api_version' "$TEMP_FILE")
if [[ ! $API_VERSION =~ ^1\. ]]; then
  echo "The API Version has changed. Aborting"
  rm "$TEMP_FILE"
  exit 1
fi

parse_date() {
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS date command
    date -j -f "%Y-%m-%dT%H:%M:%S" "$1" +%s 2>/dev/null || date -j -f "%Y-%m-%d %H:%M:%S" "$1" +%s 2>/dev/null || date -j -f "%Y-%m-%d" "$1" +%s
  else
    # GNU date (Linux)
    date -u -d "$1" +%s
  fi
}

REMOTE_DATE=$(jq -r '.last_update_date' "$TEMP_FILE")
LOCAL_DATE=$(jq -r '.last_update_date' data/caniemail.json)
REMOTE_TIMESTAMP=$(parse_date "$REMOTE_DATE")
LOCAL_TIMESTAMP=$(parse_date "$LOCAL_DATE")

if [ "$REMOTE_TIMESTAMP" -gt "$LOCAL_TIMESTAMP" ]; then
  cp "$TEMP_FILE" data/caniemail.json
  # We'll do this pre-release
  # pnpm test
  git add data/caniemail.json
  git commit -m "chore: update caniemail.json"
  git push
fi

rm "$TEMP_FILE"
