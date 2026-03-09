#!/bin/bash

echo "🧪 Testing Reset Password Flow"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if environment variables are set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY" ]; then
    echo -e "${RED}❌ Missing Supabase environment variables${NC}"
    echo "Loading from .env.local..."
    if [ -f .env.local ]; then
        export $(cat .env.local | grep -v '^#' | xargs)
    else
        echo -e "${RED}❌ .env.local not found${NC}"
        exit 1
    fi
fi

SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY

echo "1️⃣  Checking if dev server is running..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|304"; then
    echo -e "${GREEN}✅ Dev server is running${NC}"
else
    echo -e "${YELLOW}⚠️  Dev server not detected. Starting it now...${NC}"
    npm run dev &
    SERVER_PID=$!
    echo "Waiting for server to start..."
    sleep 5
fi
echo ""

echo "2️⃣  Testing reset password page accessibility..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/reset-password)
if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Reset password page is accessible (HTTP $HTTP_STATUS)${NC}"
else
    echo -e "${YELLOW}⚠️  Reset password page returned status: $HTTP_STATUS${NC}"
fi
echo ""

echo "3️⃣  Testing password reset API request..."
TEST_EMAIL=${TEST_EMAIL:-"test@example.com"}

# Make the API call to Supabase
RESPONSE=$(curl -s -X POST \
  "${SUPABASE_URL}/auth/v1/recover" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${TEST_EMAIL}\",\"options\":{\"redirectTo\":\"http://localhost:3000/reset-password\"}}")

if echo "$RESPONSE" | grep -q "error"; then
    echo -e "${RED}❌ Error requesting password reset:${NC}"
    echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
else
    echo -e "${GREEN}✅ Password reset email request sent to: $TEST_EMAIL${NC}"
    echo "   Check the email for reset link"
fi
echo ""

echo "4️⃣  Testing page content..."
PAGE_CONTENT=$(curl -s http://localhost:3000/reset-password)
if echo "$PAGE_CONTENT" | grep -q "Validating Reset Link"; then
    echo -e "${GREEN}✅ Page contains expected content${NC}"
else
    echo -e "${YELLOW}⚠️  Page might not be rendering correctly${NC}"
fi
echo ""

echo "📝 Manual Testing Instructions:"
echo "   1. Check email at: $TEST_EMAIL"
echo "   2. Click the reset link in the email"
echo "   3. You should see 'Validating Reset Link...' briefly"
echo "   4. Enter a new password meeting these requirements:"
echo "      - At least 8 characters"
echo "      - One uppercase letter"
echo "      - One lowercase letter" 
echo "      - One number"
echo "      - One special character"
echo "   5. Confirm the password"
echo "   6. Click 'Reset Password'"
echo "   7. You should see a success message"
echo ""

echo "🔍 Testing with direct browser:"
echo "   Open: http://localhost:3000/reset-password"
echo "   Note: Without a valid token, you'll see 'Reset Link Invalid' after 5 seconds"
echo ""

echo -e "${GREEN}✅ Test setup complete!${NC}"

# Cleanup
if [ ! -z "$SERVER_PID" ]; then
    echo ""
    echo "Press Ctrl+C to stop the dev server..."
    wait $SERVER_PID
fi