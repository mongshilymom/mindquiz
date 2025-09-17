#!/bin/bash

# MindQuiz Production Smoke Test Script
# Usage: ./smoke-test.sh [BASE_URL] [ADMIN_PASS]

BASE_URL=${1:-"https://mindquiz.app"}
ADMIN_PASS=${2:-"your_admin_password"}

echo "🚀 MindQuiz Smoke Test Starting..."
echo "Base URL: $BASE_URL"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Test function
test_endpoint() {
    local name="$1"
    local url="$2"
    local expected_status="$3"

    echo -n "Testing $name... "
    local status=$(curl -s -o /dev/null -w "%{http_code}" "$url")

    if [ "$status" -eq "$expected_status" ]; then
        success "$name (HTTP $status)"
    else
        error "$name (Expected: $expected_status, Got: $status)"
    fi
}

# Test JSON endpoint
test_json_endpoint() {
    local name="$1"
    local url="$2"
    local expected_field="$3"

    echo -n "Testing $name... "
    local response=$(curl -s "$url")

    if echo "$response" | grep -q "$expected_field"; then
        success "$name"
    else
        error "$name (Response: $response)"
    fi
}

echo "1. Health Checks"
echo "----------------"
test_json_endpoint "Health API" "$BASE_URL/api/health" "ok"

echo -e "\n2. OG Image Generation"
echo "---------------------"
test_endpoint "OG Image" "$BASE_URL/api/og?type=PJEM&persona=통찰력있는전략가&meme=피젬&name=Alex&v=$(date +%s)" 200

echo -e "\n3. Share Links (Meta + Redirect)"
echo "-------------------------------"
test_endpoint "Share Link Redirect" "$BASE_URL/r/demo1" 200

echo -e "\n4. Client App"
echo "------------"
test_endpoint "Main App" "$BASE_URL/app/result/demo1" 200
test_endpoint "Hub Page" "$BASE_URL/hub" 200

echo -e "\n5. Payment Ready Endpoints (Structure Test)"
echo "------------------------------------------"
# Test that endpoints exist (will return 400 without proper body, but that's expected)
test_endpoint "KakaoPay Ready" "$BASE_URL/api/payment/kakao/ready" 400
test_endpoint "NaverPay Ready" "$BASE_URL/api/payment/naver/ready" 400

echo -e "\n6. Admin Endpoints (Auth Check)"
echo "------------------------------"
test_endpoint "Admin Logs (No Auth)" "$BASE_URL/admin/logs" 401
test_endpoint "Admin Files (No Auth)" "$BASE_URL/admin/files" 401

if [ "$ADMIN_PASS" != "your_admin_password" ]; then
    test_endpoint "Admin Logs (With Auth)" "$BASE_URL/admin/logs?pass=$ADMIN_PASS" 200
    test_endpoint "Admin Files (With Auth)" "$BASE_URL/admin/files?pass=$ADMIN_PASS" 200
else
    warning "Skipping authenticated admin tests (no password provided)"
fi

echo -e "\n7. Static Asset Caching"
echo "----------------------"
# Check cache headers
echo -n "Testing static asset caching... "
cache_header=$(curl -s -I "$BASE_URL/assets/favicon.ico" 2>/dev/null | grep -i "cache-control" || echo "No cache header")
if echo "$cache_header" | grep -q "max-age"; then
    success "Cache headers present"
else
    warning "Cache headers missing or not optimal"
fi

echo -e "\n8. Security Headers"
echo "-----------------"
echo -n "Testing security headers... "
headers=$(curl -s -I "$BASE_URL/" 2>/dev/null)

if echo "$headers" | grep -qi "x-frame-options"; then
    success "X-Frame-Options header present"
else
    warning "X-Frame-Options header missing"
fi

if echo "$headers" | grep -qi "x-content-type-options"; then
    success "X-Content-Type-Options header present"
else
    warning "X-Content-Type-Options header missing"
fi

echo -e "\n9. SSL/HTTPS Check"
echo "-----------------"
if [[ $BASE_URL == https* ]]; then
    echo -n "Testing SSL certificate... "
    if curl -s -I "$BASE_URL/" > /dev/null 2>&1; then
        success "SSL certificate valid"
    else
        error "SSL certificate issues"
    fi
else
    warning "Not testing SSL (HTTP URL provided)"
fi

echo -e "\n10. Performance Check"
echo "-------------------"
echo -n "Testing response time... "
response_time=$(curl -s -o /dev/null -w "%{time_total}" "$BASE_URL/api/health")
if (( $(echo "$response_time < 2.0" | bc -l 2>/dev/null || echo "0") )); then
    success "Response time: ${response_time}s"
else
    warning "Response time slow: ${response_time}s"
fi

echo -e "\n================================="
echo "🏁 Smoke Test Completed!"
echo ""
echo "📋 Manual Tests to Complete:"
echo "   • KakaoPay: ready→approve flow"
echo "   • NaverPay: ready→approve flow"
echo "   • Coupon A (10%) + payment"
echo "   • Coupon B (expansion) + payment"
echo "   • Admin refund via /admin/payment/kakao/cancel"
echo "   • GA4 real-time events in dashboard"
echo "   • KakaoTalk share thumbnail"
echo "   • Log rotation at 4:10 AM KST"
echo ""
echo "🔧 Post-Launch Monitoring:"
echo "   • Check PM2 status: pm2 status"
echo "   • Check logs: pm2 logs mindquiz"
echo "   • Monitor /admin/files for backups"
echo "   • Verify GA4 purchase_complete events"