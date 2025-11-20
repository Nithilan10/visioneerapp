#!/bin/bash

# Test script to verify backend routes are working
# Usage: ./test-routes.sh [SERVER_IP]

SERVER_IP=${1:-localhost}
PORT=3000
BASE_URL="http://${SERVER_IP}:${PORT}"

echo "Testing backend routes at ${BASE_URL}"
echo "=========================================="
echo ""

# Test 1: Health check (products endpoint)
echo "1. Testing GET /api/products..."
curl -s -o /dev/null -w "Status: %{http_code}\n" "${BASE_URL}/api/products"
echo ""

# Test 2: Get a specific product (if exists)
echo "2. Testing GET /api/products/:id..."
curl -s -o /dev/null -w "Status: %{http_code}\n" "${BASE_URL}/api/products/test-id"
echo ""

# Test 3: List GLB files in a container
echo "3. Testing GET /api/models/glb/:container..."
curl -s -o /dev/null -w "Status: %{http_code}\n" "${BASE_URL}/api/models/glb/test-container"
echo ""

# Test 4: Get GLB file URL
echo "4. Testing GET /api/models/glb/:container/:filename/url..."
curl -s -o /dev/null -w "Status: %{http_code}\n" "${BASE_URL}/api/models/glb/test-container/test.glb/url"
echo ""

echo "=========================================="
echo "Test complete!"
echo ""
echo "To test from another machine, use your computer's IP:"
echo "  ./test-routes.sh 192.168.1.100"
echo ""
echo "To find your IP address:"
echo "  Mac/Linux: ifconfig | grep 'inet '"
echo "  Windows: ipconfig"

