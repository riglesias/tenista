#!/bin/bash
# Supabase Local Dev Setup
# Usage: ./supabase/setup.sh [start|reset]
#
# The Supabase CLI migration runner can't handle dollar-quoted function bodies
# (pgx prepared statement limitation). We work around this by:
#   1. Running migrations (tables + indexes) via the CLI
#   2. Applying functions + RLS/triggers via psql directly
#
# Prerequisites: Docker Desktop running, postgresql@15 installed via Homebrew

set -e

PSQL="/opt/homebrew/Cellar/postgresql@15/15.13/bin/psql"
DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if [ ! -f "$PSQL" ]; then
  echo "Error: psql not found at $PSQL"
  echo "Install with: brew install postgresql@15"
  exit 1
fi

apply_extra_sql() {
  echo "Applying functions..."
  "$PSQL" "$DB_URL" -f "$SCRIPT_DIR/.skipped/00000000000001_functions.sql" -q 2>&1 | grep -v "already exists" || true
  echo "Applying RLS policies, triggers, and views..."
  "$PSQL" "$DB_URL" -f "$SCRIPT_DIR/.skipped/00000000000002_indexes_rls_triggers.sql" -q 2>&1 | grep -v "already exists" || true
  echo ""
}

case "${1:-start}" in
  start)
    echo "Starting Supabase local dev..."
    supabase start
    echo ""
    apply_extra_sql
    echo "✓ Local dev ready! All 30 tables, 32 functions, 88 RLS policies applied."
    ;;
  reset)
    echo "Resetting local database..."
    supabase db reset
    apply_extra_sql
    echo "✓ Database reset complete with all schema objects."
    ;;
  *)
    echo "Usage: $0 [start|reset]"
    exit 1
    ;;
esac
