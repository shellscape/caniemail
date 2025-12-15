# Update `data/caniemail.json` from caniemail.com (daily)

## Overview

Intended schedule: run daily at 12:00 (time-of-day not enforced by this repo).

Check https://www.caniemail.com/api/data.json for a newer `last_update_date`. If there’s an update, open a PR with the refreshed `data/caniemail.json` (and snapshots only when failures are snapshot-only).

This playbook assumes `origin` points at GitHub (github.com) and that `gh` is authenticated for the repo.
It supports standard github.com HTTPS/SSH remotes only; other hosts or URL formats will cause it to exit.

## Creates

- Artifact: Pull request (max 1 per run)
- Title pattern: `chore: update caniemail.json for revision <YYYY-MM-DD>`
- Branch: `chore/data-update/<unix-timestamp>`

## No-op when

- The remote `last_update_date` is the same as (or older than) the local `data/caniemail.json`.
- A branch already exists for the remote revision.
- An open PR already exists for the remote revision.

## Steps

1. Fetch the remote dataset into a temp file and capture the remote/local revision dates.

   ```bash
   set -euo pipefail
   tmp_json="$(mktemp)"
   cleanup() { rm -f "$tmp_json"; }
   trap cleanup EXIT

   curl -fsSL 'https://www.caniemail.com/api/data.json' > "$tmp_json"

   remote_date="$(jq -r '.last_update_date // empty' "$tmp_json")"
   local_date="$(jq -r '.last_update_date // empty' data/caniemail.json)"

   if [ -z "$remote_date" ] || [ -z "$local_date" ]; then
     echo "Missing last_update_date (remote='$remote_date' local='$local_date')" >&2
     exit 1
   fi

   if ! command -v node >/dev/null 2>&1; then
     echo "Error: 'node' is required to parse last_update_date but is not installed or not on PATH" >&2
     exit 1
   fi

   remote_ts="$(node -e 'const ms = Date.parse(process.argv[1]); if (!Number.isFinite(ms)) process.exit(1); console.log(Math.floor(ms / 1000));' "$remote_date")" || {
     echo "Unable to parse remote last_update_date: '$remote_date'" >&2
     exit 1
   }
   local_ts="$(node -e 'const ms = Date.parse(process.argv[1]); if (!Number.isFinite(ms)) process.exit(1); console.log(Math.floor(ms / 1000));' "$local_date")" || {
     echo "Unable to parse local last_update_date: '$local_date'" >&2
     exit 1
   }
   echo "remote=$remote_date ($remote_ts) local=$local_date ($local_ts)"

   if [ "$remote_ts" -le "$local_ts" ]; then
     echo "No update needed: remote_ts ($remote_ts) <= local_ts ($local_ts)"
     exit 0
   fi
   ```

2. If `remote_ts` is less than or equal to `local_ts`, exit cleanly (no-op); otherwise continue.

3. Create a deterministic branch name for the revision, and avoid duplicates.

   ```bash
   branch="chore/data-update/$remote_ts"

   # Derive <owner>/<repo> from origin for gh --repo. Assumes origin is GitHub (github.com).
   origin_url="$(git remote get-url origin)"
   repo="$origin_url"
   repo="${repo#https://github.com/}"
   repo="${repo#ssh://git@github.com/}"
   repo="${repo#git@github.com:}"
   repo="${repo%.git}"

   case "$repo" in
     */*) ;;
     *)
       echo "Unable to derive GitHub repo from origin URL: $origin_url" >&2
       exit 1
       ;;
   esac

   case "$repo" in
     *://*|*@*)
       echo "Unable to derive GitHub repo from origin URL: $origin_url" >&2
       exit 1
       ;;
   esac

   # If the branch already exists remotely, no-op.
   if git ls-remote --exit-code --heads origin "$branch" >/dev/null 2>&1; then
     echo "Branch already exists: $branch"
     exit 0
   fi

   # If an open PR already exists for this branch, no-op.
   # Requires $repo to be a valid owner/repo derived from origin.
   open_pr_count="$(gh pr list --repo "$repo" --state open --head "$branch" --json number --jq 'length')"
   if [ "$open_pr_count" -gt 0 ]; then
     echo "Open PR already exists for branch: $branch"
     exit 0
   fi
   ```

4. Create the branch and update `data/caniemail.json`.

   ```bash
   git checkout -b "$branch"
   cp "$tmp_json" data/caniemail.json
   ```

5. Run tests once (do not update snapshots yet).

   ```bash
   snapshots_updated=false

   set +e
   pnpm test
   test_exit=$?
   set -e
   ```

6. If `pnpm test` failed, determine whether failures are snapshot-only.

   1. Run `pnpm test -- --update` _once_, then rerun `pnpm test`.
   2. If the second `pnpm test` passes, snapshot-only failures were fixed; keep the snapshot updates.
   3. If the second `pnpm test` still fails, **do not attempt to fix anything** (including snapshots). Restore any snapshot changes and continue.
      - This is important: non-snapshot failures must be reviewed by a maintainer; Charlie should not attempt to resolve them.

   ```bash
   if [ "$test_exit" -ne 0 ]; then
     pnpm test -- --update || true

     set +e
     pnpm test
     post_update_exit=$?
     set -e

     if [ "$post_update_exit" -eq 0 ] && [ -n "$(git status --porcelain -- test/__snapshots__)" ]; then
       snapshots_updated=true
     elif [ "$post_update_exit" -ne 0 ]; then
       git restore --staged --worktree test/__snapshots__ || true
       git clean -fd -- test/__snapshots__ || true
     fi
   fi
   ```

7. Commit the changes and push the branch.

   ```bash
   git add data/caniemail.json

   if [ "$snapshots_updated" = true ]; then
     git add test/__snapshots__
   fi

   git commit -m "chore: update caniemail.json for revision ${remote_date}"
   git push -u origin "$branch"
   ```

8. Open a PR.
   - Title: `chore: update caniemail.json for revision <remote_date>`
   - Body should include:
     - Remote revision date (`last_update_date`)
     - Whether snapshots were updated
     - If tests are failing after the snapshot check: explicitly note that failures are _not_ snapshot-only and need maintainer review
   ```bash
   test_status="passed (no snapshot updates needed)"
   if [ "$test_exit" -ne 0 ] && [ "${post_update_exit:-1}" -eq 0 ]; then
     test_status="passed after snapshot updates"
   elif [ "$test_exit" -ne 0 ] && [ "${post_update_exit:-1}" -ne 0 ]; then
     test_status="failed (non-snapshot failures; needs maintainer review)"
   fi

   snapshots_label="no"
   if [ "$snapshots_updated" = true ]; then
     snapshots_label="yes"
   fi

   body="$(cat <<EOF
Updated data/caniemail.json to remote last_update_date: ${remote_date}.

- Tests: ${test_status}
- Snapshots updated: ${snapshots_label}
EOF
)"

   gh pr create --repo "$repo" --title "chore: update caniemail.json for revision ${remote_date}" --body "$body" --base main
   ```

## Rollback

- Close the PR and delete the branch `chore/data-update/<unix-timestamp>`.

## References

- Current brittle workflow: `.github/workflows/fetch-json.yml`
- Legacy script: `scripts/update-data.sh`
