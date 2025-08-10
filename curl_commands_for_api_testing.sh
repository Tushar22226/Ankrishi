#!/bin/bash
# Curl Commands for API Testing and Development
# This file contains useful curl commands for testing APIs

# ===== BASIC HTTP METHODS =====

# GET request - retrieve data
echo "===== Basic GET request ====="
curl -X GET "https://jsonplaceholder.typicode.com/posts/1"

# POST request - create data
echo -e "\n\n===== Basic POST request ====="
curl -X POST "https://jsonplaceholder.typicode.com/posts" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Post", "body": "This is a test post", "userId": 1}'

# PUT request - update data
echo -e "\n\n===== Basic PUT request ====="
curl -X PUT "https://jsonplaceholder.typicode.com/posts/1" \
  -H "Content-Type: application/json" \
  -d '{"id": 1, "title": "Updated Post", "body": "This post has been updated", "userId": 1}'

# DELETE request - delete data
echo -e "\n\n===== Basic DELETE request ====="
curl -X DELETE "https://jsonplaceholder.typicode.com/posts/1"

# ===== WORKING WITH HEADERS =====

echo -e "\n\n===== Request with custom headers ====="
curl -X GET "https://httpbin.org/headers" \
  -H "User-Agent: My-Test-App/1.0" \
  -H "Authorization: Bearer test_token" \
  -H "Accept: application/json"

# ===== FORM SUBMISSIONS =====

# POST form data (application/x-www-form-urlencoded)
echo -e "\n\n===== POST form data ====="
curl -X POST "https://httpbin.org/post" \
  -d "name=John Doe" \
  -d "email=john@example.com" \
  -d "message=Hello world"

# POST multipart form data (for file uploads)
echo -e "\n\n===== POST multipart form data with file ====="
curl -X POST "https://httpbin.org/post" \
  -F "name=John Doe" \
  -F "profile_image=@/path/to/image.jpg"

# ===== HANDLING COOKIES =====

echo -e "\n\n===== Working with cookies ====="
# Save cookies to a file
curl -c cookies.txt "https://httpbin.org/cookies/set?session=test123"

# Use cookies from a file
curl -b cookies.txt "https://httpbin.org/cookies"

# ===== ADVANCED OPTIONS =====

# Follow redirects
echo -e "\n\n===== Following redirects ====="
curl -L "https://httpbin.org/redirect/2"

# Set timeout
echo -e "\n\n===== Setting timeout ====="
curl --connect-timeout 5 "https://httpbin.org/delay/3"

# Show request and response headers
echo -e "\n\n===== Showing verbose output ====="
curl -v "https://httpbin.org/get"

# Output response headers only
echo -e "\n\n===== Showing response headers only ====="
curl -I "https://httpbin.org/get"

# ===== AUTHENTICATION =====

# Basic authentication
echo -e "\n\n===== Basic authentication ====="
curl -u username:password "https://httpbin.org/basic-auth/username/password"

# ===== WORKING WITH JSON =====

echo -e "\n\n===== POST with JSON data ====="
curl -X POST "https://httpbin.org/post" \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "age": 30, "email": "john@example.com"}'

# ===== EXAMPLE FOR FORM SUBMISSION WITH VIEWSTATE (EDUCATIONAL) =====

echo -e "\n\n===== Example for form with ViewState (for educational purposes) ====="
# This is a template for how you might structure a request to an ASP.NET form
# Replace placeholders with actual values for your test environment
curl -X POST "https://example-test-site.com/form.aspx" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "__VIEWSTATE=your_viewstate_value" \
  -d "__VIEWSTATEGENERATOR=your_viewstate_generator" \
  -d "__EVENTVALIDATION=your_event_validation" \
  -d "field1=value1" \
  -d "field2=value2"

# Note: For ASP.NET forms, you typically need to:
# 1. First GET the form to obtain the current ViewState
# 2. Extract the ViewState, ViewStateGenerator, and EventValidation values
# 3. Include these in your POST request along with your form fields

# ===== TESTING API RATE LIMITS =====

echo -e "\n\n===== Making multiple requests to test rate limits ====="
for i in {1..5}; do
  curl -s "https://httpbin.org/get?request=$i"
  echo -e "\n---\n"
  sleep 1
done
