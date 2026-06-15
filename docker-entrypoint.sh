#!/bin/sh
set -e

# Fail fast with a clear message if the database URL is missing
if [ -z "$DATABASE_URL" ]; then
  echo ""
  echo "ERROR: DATABASE_URL environment variable is not set."
  echo ""
  echo "For Render deployment:"
  echo "  1. Create a PostgreSQL database on Render (or use an external one)"
  echo "  2. Add DATABASE_URL to the service's Environment Variables in the Render dashboard"
  echo "     Example: postgresql://user:pass@host:5432/dbname"
  echo ""
  exit 1
fi

echo "Running Prisma migrations..."
npx prisma migrate deploy

echo "Starting application..."
exec node dist/src/main.js
