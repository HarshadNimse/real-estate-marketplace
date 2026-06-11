#!/usr/bin/env python
import requests
import json
import time
from io import BytesIO

BASE_URL = 'http://localhost:5000/api'
seller_email = 'seller6391595726@test.com'
buyer_email = 'buyer6391595726@test.com'
password = 'TestPass123'

def print_header(text):
    print(f'\n{"="*70}')
    print(f'  {text}')
    print(f'{"="*70}\n')

def print_test(test_name):
    print(f'\n>>> {test_name}')
    print('-' * 70)

print_header('DETAILED API ENDPOINT TESTING')

# Get buyer token
print_test('Step 1: Getting buyer token')
response = requests.post(
    f'{BASE_URL}/auth/login',
    json={'email': buyer_email, 'password': password}
)
buyer_token = response.json()['data']['accessToken']
print(f'✓ Token obtained')

# Test GET /auth/me with detailed response
print_test('DETAILED TEST: GET /auth/me')
print(f'Endpoint: GET {BASE_URL}/auth/me')
print(f'Authorization: Bearer {buyer_token[:30]}...\n')

response = requests.get(
    f'{BASE_URL}/auth/me',
    headers={'Authorization': f'Bearer {buyer_token}'}
)

print(f'Status Code: {response.status_code}')
data = response.json()
print(f'Full Response:\n{json.dumps(data, indent=2)}')

# Test GET /favourites with detailed response
print_test('DETAILED TEST: GET /favourites')
print(f'Endpoint: GET {BASE_URL}/favourites')
print(f'Authorization: Bearer {buyer_token[:30]}...\n')

response = requests.get(
    f'{BASE_URL}/favourites',
    headers={'Authorization': f'Bearer {buyer_token}'}
)

print(f'Status Code: {response.status_code}')
data = response.json()
print(f'Full Response:\n{json.dumps(data, indent=2)}')
print(f'\nData Type: {type(data.get("data")).__name__}')
print(f'Expected: list or array')

# Test property creation with image (multipart form data)
print_test('DETAILED TEST: POST /properties with Multipart Images')

# Login as seller
seller_response = requests.post(
    f'{BASE_URL}/auth/login',
    json={'email': seller_email, 'password': password}
)
seller_token = seller_response.json()['data']['accessToken']

print(f'Endpoint: POST {BASE_URL}/properties')
print(f'Content-Type: multipart/form-data')
print(f'Authorization: Bearer {seller_token[:30]}...\n')

# Create a simple test image (1x1 pixel PNG)
test_image = BytesIO(
    b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01'
    b'\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01'
    b'\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82'
)

files = {
    'images': ('test1.png', test_image, 'image/png'),
}

data = {
    'title': f'Multipart Test Property {int(time.time())}',
    'description': 'Testing multipart form data with images',
    'price': 30000,
    'city': 'Mumbai',
    'address_line': 'Test Street',
    'latitude': 19.0760,
    'longitude': 72.8777,
    'property_type': 'rent',
    'bhk': 3,
    'area_sqft': 1200,
    'furnishing': 'furnished',
    'amenities': 'Gym,Pool',
}

try:
    response = requests.post(
        f'{BASE_URL}/properties',
        data=data,
        files=files,
        headers={'Authorization': f'Bearer {seller_token}'},
        timeout=10
    )
    
    print(f'Status Code: {response.status_code}')
    resp_data = response.json()
    
    print(f'Response:\n{json.dumps(resp_data, indent=2)}')
    
    if response.status_code == 201:
        print(f'\n✓ Multipart file upload: SUCCESS')
        prop = resp_data.get('data', {}).get('property', {})
        print(f'  - Property ID: {prop.get("id")}')
        print(f'  - Title: {prop.get("title")}')
        print(f'  - Images attached: {len(prop.get("images", [])) if isinstance(prop.get("images"), list) else "unknown"}')
    else:
        print(f'\n✗ Multipart file upload: FAILED')
        if resp_data.get('errors'):
            print(f'Error messages: {resp_data["errors"]}')
            
except Exception as e:
    print(f'✗ ERROR: {str(e)}')

# Test error handling
print_test('ERROR HANDLING TEST: Invalid Credentials')
print(f'Endpoint: POST {BASE_URL}/auth/login')
print(f'Testing with invalid email/password\n')

response = requests.post(
    f'{BASE_URL}/auth/login',
    json={'email': 'nonexistent@test.com', 'password': 'wrongpass'}
)

print(f'Status Code: {response.status_code}')
data = response.json()
print(f'Response:\n{json.dumps(data, indent=2)}')

if response.status_code == 401:
    print(f'\n✓ Error handling: Proper status code (401)')
    print(f'✓ Error message present: {bool(data.get("message"))}')
else:
    print(f'\n✗ Unexpected status code: {response.status_code}')

print_header('DETAILED TESTING COMPLETE')
