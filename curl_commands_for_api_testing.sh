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

# ===== UPDATING STUDENT MARKS =====

echo -e "\n\n===== Updating Mathematics marks from 37 to 47 ====="
curl -X POST "https://vnsgu.ac.in/StudentResultDisplay.aspx?HtmlURL=5370%2c11980" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "Cookie: ASP.NET_SessionId=your_session_id_here" \
  -d "__VIEWSTATE=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" \
  -d "__VIEWSTATEGENERATOR=21024940" \
  -d "operating_system_external_marks=47" \
  -d "submit=Update"
