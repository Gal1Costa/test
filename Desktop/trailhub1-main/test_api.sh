#!/bin/bash

#############################################################################
# TrailHub API Testing Script
# 
# Provides interactive testing of all TrailHub API endpoints
# Supports curl commands and multiple testing scenarios
#
# Usage:
#   chmod +x test_api.sh
#   ./test_api.sh [scenario]
#
# Scenarios:
#   - scenario1: Register user, list hikes, join hike
#   - scenario2: Create hike, update, delete (guide only)
#   - scenario3: Test privacy filtering on user profiles
#   - all: Run all scenarios
#   - health: Quick health check
#
#############################################################################

set -e

BASE_URL="${BASE_URL:-http://localhost:3000}"
TIMESTAMP=$(date +%s)

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Pretty print
print_header() {
  echo -e "\n${BLUE}=== $1 ===${NC}\n"
}

print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
  echo -e "${RED}✗ $1${NC}"
}

print_info() {
  echo -e "${YELLOW}ℹ $1${NC}"
}

# Health check
health_check() {
  print_header "Health Check"
  print_info "Testing backend connectivity..."
  
  RESPONSE=$(curl -s "$BASE_URL/healthz")
  echo "$RESPONSE" | jq '.' 2>/dev/null && print_success "Backend is running" || print_error "Backend is not responding"
}

# Scenario 1: Register user, list hikes, join hike
scenario_1() {
  print_header "Scenario 1: Register User → List Hikes → Join Hike"
  
  # Step 1: Register a new hiker
  print_info "Step 1: Registering new hiker..."
  HIKER_EMAIL="hiker_$TIMESTAMP@example.com"
  HIKER_UID="hiker-$TIMESTAMP"
  
  HIKER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/users/register" \
    -H "Content-Type: application/json" \
    -d "{
      \"firebaseUid\": \"$HIKER_UID\",
      \"email\": \"$HIKER_EMAIL\",
      \"name\": \"Jane Hiker\",
      \"role\": \"hiker\"
    }")
  
  HIKER_ID=$(echo "$HIKER_RESPONSE" | jq -r '.id' 2>/dev/null || echo "error")
  
  if [ "$HIKER_ID" != "error" ] && [ -n "$HIKER_ID" ]; then
    print_success "Registered hiker with ID: $HIKER_ID"
    echo "$HIKER_RESPONSE" | jq '.' 2>/dev/null | head -10
  else
    print_error "Failed to register hiker"
    echo "$HIKER_RESPONSE" | jq '.' 2>/dev/null
    return 1
  fi
  
  # Step 2: List hikes
  print_info "Step 2: Listing all hikes..."
  HIKES_RESPONSE=$(curl -s "$BASE_URL/api/hikes")
  HIKE_COUNT=$(echo "$HIKES_RESPONSE" | jq 'length' 2>/dev/null || echo 0)
  
  if [ "$HIKE_COUNT" -gt 0 ]; then
    print_success "Found $HIKE_COUNT hikes"
    HIKE_ID=$(echo "$HIKES_RESPONSE" | jq -r '.[0].id' 2>/dev/null)
    echo "$HIKES_RESPONSE" | jq '.[0]' 2>/dev/null | head -15
  else
    print_error "No hikes found (create one first with scenario2)"
    return 0
  fi
  
  # Step 3: Join first hike
  print_info "Step 3: Joining hike #$HIKE_ID as hiker..."
  JOIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/hikes/$HIKE_ID/join" \
    -H "x-dev-user: {\"id\":\"$HIKER_UID\",\"email\":\"$HIKER_EMAIL\",\"role\":\"hiker\"}")
  
  BOOKING_ID=$(echo "$JOIN_RESPONSE" | jq -r '.id' 2>/dev/null || echo "error")
  
  if [ "$BOOKING_ID" != "error" ] && [ -n "$BOOKING_ID" ]; then
    print_success "Joined hike with booking ID: $BOOKING_ID"
    echo "$JOIN_RESPONSE" | jq '.' 2>/dev/null
  else
    print_error "Failed to join hike"
    echo "$JOIN_RESPONSE" | jq '.' 2>/dev/null
  fi
  
  # Step 4: Check user profile (should show booking)
  print_info "Step 4: Checking user profile (should show booking)..."
  PROFILE=$(curl -s "$BASE_URL/api/users/me" \
    -H "x-dev-user: {\"id\":\"$HIKER_UID\",\"email\":\"$HIKER_EMAIL\",\"role\":\"hiker\"}")
  
  BOOKING_COUNT=$(echo "$PROFILE" | jq '.bookings | length' 2>/dev/null || echo 0)
  if [ "$BOOKING_COUNT" -gt 0 ]; then
    print_success "User has $BOOKING_COUNT booking(s)"
    echo "$PROFILE" | jq '.bookings' 2>/dev/null
  else
    print_info "User has no bookings yet (may be first run)"
  fi
}

# Scenario 2: Create hike, update, delete (guide only)
scenario_2() {
  print_header "Scenario 2: Create Hike → Update → Delete (Guide Only)"
  
  GUIDE_ID="guide-$TIMESTAMP"
  GUIDE_EMAIL="guide_$TIMESTAMP@example.com"
  
  # Step 1: Create hike
  print_info "Step 1: Creating new hike..."
  CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/hikes" \
    -H "x-dev-user: {\"id\":\"$GUIDE_ID\",\"email\":\"$GUIDE_EMAIL\",\"role\":\"guide\"}" \
    -F "title=Test Hike $TIMESTAMP" \
    -F "description=A beautiful test hike" \
    -F "difficulty=moderate" \
    -F "price=55" \
    -F "capacity=15" \
    -F "date=2024-12-25")
  
  HIKE_ID=$(echo "$CREATE_RESPONSE" | jq -r '.id' 2>/dev/null || echo "error")
  
  if [ "$HIKE_ID" != "error" ] && [ -n "$HIKE_ID" ]; then
    print_success "Created hike with ID: $HIKE_ID"
    echo "$CREATE_RESPONSE" | jq '.' 2>/dev/null | head -15
  else
    print_error "Failed to create hike"
    echo "$CREATE_RESPONSE" | jq '.' 2>/dev/null
    return 1
  fi
  
  # Step 2: Update hike
  print_info "Step 2: Updating hike price..."
  UPDATE_RESPONSE=$(curl -s -X PUT "$BASE_URL/api/hikes/$HIKE_ID" \
    -H "x-dev-user: {\"id\":\"$GUIDE_ID\",\"email\":\"$GUIDE_EMAIL\",\"role\":\"guide\"}" \
    -H "Content-Type: application/json" \
    -d '{"price": 65, "capacity": 20}')
  
  UPDATED_PRICE=$(echo "$UPDATE_RESPONSE" | jq '.price' 2>/dev/null)
  
  if [ "$UPDATED_PRICE" = "65" ]; then
    print_success "Updated hike price to: $UPDATED_PRICE"
    echo "$UPDATE_RESPONSE" | jq '.' 2>/dev/null | head -15
  else
    print_error "Failed to update hike"
    echo "$UPDATE_RESPONSE" | jq '.' 2>/dev/null
  fi
  
  # Step 3: Delete hike
  print_info "Step 3: Deleting hike..."
  DELETE_RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/api/hikes/$HIKE_ID" \
    -H "x-dev-user: {\"id\":\"$GUIDE_ID\",\"email\":\"$GUIDE_EMAIL\",\"role\":\"guide\"}")
  
  HTTP_CODE=$(echo "$DELETE_RESPONSE" | tail -n1)
  
  if [ "$HTTP_CODE" = "204" ]; then
    print_success "Deleted hike (HTTP 204 No Content)"
  else
    print_error "Failed to delete hike (HTTP $HTTP_CODE)"
    echo "$DELETE_RESPONSE" | head -n -1 | jq '.' 2>/dev/null
  fi
  
  # Step 4: Verify deletion
  print_info "Step 4: Verifying hike is deleted..."
  VERIFY=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/hikes/$HIKE_ID")
  HTTP_CODE=$(echo "$VERIFY" | tail -n1)
  
  if [ "$HTTP_CODE" = "404" ]; then
    print_success "Hike deleted successfully (returns 404)"
  else
    print_info "Hike still exists or returns HTTP $HTTP_CODE"
  fi
}

# Scenario 3: Test privacy filtering
scenario_3() {
  print_header "Scenario 3: Test Privacy Filtering on User Profiles"
  
  USER_ID=1
  OTHER_USER_ID="other-user-$TIMESTAMP"
  OWNER_ID="owner-$TIMESTAMP"
  ADMIN_ID="admin-$TIMESTAMP"
  
  print_info "Testing /api/users/$USER_ID with different access levels...\n"
  
  # View 1: As another user (should get privacy-filtered view)
  print_info "View 1: As another hiker (privacy-filtered)..."
  OTHER_VIEW=$(curl -s "$BASE_URL/api/users/$USER_ID" \
    -H "x-dev-user: {\"id\":\"$OTHER_USER_ID\",\"email\":\"other@local\",\"role\":\"hiker\"}")
  
  HAS_EMAIL=$(echo "$OTHER_VIEW" | jq 'has("email")' 2>/dev/null)
  if [ "$HAS_EMAIL" = "false" ]; then
    print_success "Email is hidden in public view"
  else
    print_info "Email field present (may be intentional)"
  fi
  echo "$OTHER_VIEW" | jq '.' 2>/dev/null | head -20
  
  # View 2: As the owner (should get full profile)
  print_info "\nView 2: As the owner (full profile)..."
  OWNER_VIEW=$(curl -s "$BASE_URL/api/users/$USER_ID" \
    -H "x-dev-user: {\"id\":\"$OWNER_ID\",\"email\":\"owner@local\",\"role\":\"guide\",\"firebaseUid\":\"$OWNER_ID\"}")
  
  HAS_EMAIL=$(echo "$OWNER_VIEW" | jq 'has("email")' 2>/dev/null)
  if [ "$HAS_EMAIL" = "true" ]; then
    print_success "Email is visible to owner"
  fi
  echo "$OWNER_VIEW" | jq '.' 2>/dev/null | head -20
  
  # View 3: As admin (should get full profile)
  print_info "\nView 3: As admin (full profile)..."
  ADMIN_VIEW=$(curl -s "$BASE_URL/api/users/$USER_ID" \
    -H "x-dev-user: {\"id\":\"$ADMIN_ID\",\"email\":\"admin@local\",\"role\":\"admin\"}")
  
  HAS_EMAIL=$(echo "$ADMIN_VIEW" | jq 'has("email")' 2>/dev/null)
  if [ "$HAS_EMAIL" = "true" ]; then
    print_success "Email is visible to admin"
  fi
  echo "$ADMIN_VIEW" | jq '.' 2>/dev/null | head -20
}

# Run all scenarios
run_all_scenarios() {
  print_header "Running All Scenarios"
  
  health_check
  scenario_1
  scenario_2
  scenario_3
  
  print_header "All Scenarios Complete"
}

# Main logic
main() {
  SCENARIO="${1:-health}"
  
  case "$SCENARIO" in
    health)
      health_check
      ;;
    scenario1|s1)
      health_check
      scenario_1
      ;;
    scenario2|s2)
      health_check
      scenario_2
      ;;
    scenario3|s3)
      health_check
      scenario_3
      ;;
    all)
      run_all_scenarios
      ;;
    *)
      echo "Usage: $0 [scenario]"
      echo ""
      echo "Scenarios:"
      echo "  health              - Quick health check"
      echo "  scenario1 (s1)      - Register user, list hikes, join hike"
      echo "  scenario2 (s2)      - Create hike, update, delete (guide only)"
      echo "  scenario3 (s3)      - Test privacy filtering on user profiles"
      echo "  all                 - Run all scenarios"
      echo ""
      echo "Environment variables:"
      echo "  BASE_URL            - API base URL (default: http://localhost:3000)"
      echo ""
      echo "Examples:"
      echo "  ./test_api.sh health"
      echo "  ./test_api.sh scenario1"
      echo "  BASE_URL=https://api.example.com ./test_api.sh all"
      exit 1
      ;;
  esac
}

main "$@"
