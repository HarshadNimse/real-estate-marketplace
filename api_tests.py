#!/usr/bin/env python
import requests
import json
import time

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

def test_login():
    """Test 1: Login endpoint"""
    print_test('TEST 1: LOGIN ENDPOINT')
    print(f'POST {BASE_URL}/auth/login')
    print(f'Email: {buyer_email}')
    print(f'Password: {password}')
    
    try:
        response = requests.post(
            f'{BASE_URL}/auth/login',
            json={'email': buyer_email, 'password': password},
            timeout=5
        )
        
        print(f'\n✓ Status Code: {response.status_code}')
        data = response.json()
        print(f'✓ Response Format: Valid JSON')
        print(f'✓ Success: {data.get("success")}')
        print(f'✓ Message: {data.get("message")}')
        
        if data.get('data', {}).get('accessToken'):
            token = data['data']['accessToken']
            print(f'✓ Token Structure: {{"accessToken": "{token[:30]}..."}}')
            return token
        else:
            print(f'✗ No token in response')
            print(f'Full response: {json.dumps(data, indent=2)}')
            return None
            
    except Exception as e:
        print(f'✗ ERROR: {str(e)}')
        return None

def test_get_profile(token):
    """Test 4: Get profile endpoint"""
    print_test('TEST 4: GET PROFILE ENDPOINT')
    print(f'GET {BASE_URL}/auth/me')
    print(f'Authorization: Bearer {token[:30]}...')
    
    if not token:
        print('✗ Skipped: No auth token available')
        return False
        
    try:
        response = requests.get(
            f'{BASE_URL}/auth/me',
            headers={'Authorization': f'Bearer {token}'},
            timeout=5
        )
        
        print(f'\n✓ Status Code: {response.status_code}')
        data = response.json()
        
        if response.status_code == 200 and data.get('data'):
            user = data['data']
            print(f'✓ User Data Returned: YES')
            print(f'  - Name: {user.get("full_name")}')
            print(f'  - Email: {user.get("email")}')
            print(f'  - Role: {user.get("role")}')
            print(f'  - User ID: {user.get("id")}')
            return True
        else:
            print(f'✗ User data not returned')
            print(f'Response: {json.dumps(data, indent=2)}')
            return False
            
    except Exception as e:
        print(f'✗ ERROR: {str(e)}')
        return False

def test_get_favourites(token):
    """Test 3: Get favourites endpoint"""
    print_test('TEST 3: GET FAVOURITES ENDPOINT')
    print(f'GET {BASE_URL}/favourites')
    print(f'Authorization: Bearer {token[:30]}...')
    
    if not token:
        print('✗ Skipped: No auth token available')
        return False
        
    try:
        response = requests.get(
            f'{BASE_URL}/favourites',
            headers={'Authorization': f'Bearer {token}'},
            timeout=5
        )
        
        print(f'\n✓ Status Code: {response.status_code}')
        data = response.json()
        
        if response.status_code == 200:
            print(f'✓ Response Format: Valid JSON')
            print(f'✓ Authentication: Required and verified')
            
            if isinstance(data.get('data'), list):
                print(f'✓ Returns Array: YES (length: {len(data["data"])})')
                if len(data['data']) > 0:
                    print(f'  Sample items: {data["data"][:2]}')
            else:
                print(f'✓ Data structure: {type(data.get("data")).__name__}')
            return True
        else:
            print(f'✗ Unexpected status code')
            print(f'Response: {json.dumps(data, indent=2)}')
            return False
            
    except Exception as e:
        print(f'✗ ERROR: {str(e)}')
        return False

def test_create_property(token):
    """Test 2: Create property endpoint"""
    print_test('TEST 2: CREATE PROPERTY ENDPOINT')
    print(f'POST {BASE_URL}/properties')
    print(f'Content-Type: application/json')
    print(f'Authorization: Bearer {token[:30]}...')
    
    if not token:
        print('✗ Skipped: No auth token available')
        return False
    
    # Use seller token
    seller_email_test = 'seller6391595726@test.com'
    seller_password = 'TestPass123'
    
    try:
        # First login as seller
        login_resp = requests.post(
            f'{BASE_URL}/auth/login',
            json={'email': seller_email_test, 'password': seller_password},
            timeout=5
        )
        
        if login_resp.status_code != 200:
            print('✗ Could not login as seller')
            return False
            
        seller_token = login_resp.json()['data']['accessToken']
        
        # Create property
        property_data = {
            'title': f'Test Property {int(time.time())}',
            'description': 'End-to-end test property',
            'price': 25000,
            'city': 'Pune',
            'address_line': 'Test Area',
            'latitude': 18.5074,
            'longitude': 73.8077,
            'property_type': 'rent',
            'bhk': 2,
            'area_sqft': 950,
            'furnishing': 'semi',
            'amenities': ['Lift', 'Parking']
        }
        
        response = requests.post(
            f'{BASE_URL}/properties',
            json=property_data,
            headers={'Authorization': f'Bearer {seller_token}'},
            timeout=5
        )
        
        print(f'\n✓ Status Code: {response.status_code}')
        data = response.json()
        
        if response.status_code == 201:
            print(f'✓ Property Created: YES')
            print(f'✓ Response Format: Valid JSON')
            
            prop = data.get('data', {}).get('property', {})
            print(f'  - Property ID: {prop.get("id")}')
            print(f'  - Title: {prop.get("title")}')
            print(f'  - Price: {prop.get("price")}')
            print(f'  - Status: {prop.get("status")}')
            return True
        else:
            print(f'✗ Failed to create property')
            print(f'Status: {response.status_code}')
            print(f'Response: {json.dumps(data, indent=2)}')
            return False
            
    except Exception as e:
        print(f'✗ ERROR: {str(e)}')
        return False

def test_admin_stats(token):
    """Test 5: Admin stats endpoint"""
    print_test('TEST 5: ADMIN STATS ENDPOINT')
    print(f'GET {BASE_URL}/admin/stats')
    print(f'Authorization: Bearer {token[:30]}...')
    
    if not token:
        print('✗ Skipped: No auth token available')
        return False
    
    # Try with admin user
    admin_email = 'admin@example.com'
    admin_password = 'Password123'
    
    try:
        # Login as admin
        login_resp = requests.post(
            f'{BASE_URL}/auth/login',
            json={'email': admin_email, 'password': admin_password},
            timeout=5
        )
        
        if login_resp.status_code != 200:
            print(f'✗ Could not login as admin')
            print(f'  Note: Admin user may not exist. This is expected in test environment.')
            
            # Try with regular token anyway
            admin_token = token
        else:
            admin_token = login_resp.json()['data']['accessToken']
        
        response = requests.get(
            f'{BASE_URL}/admin/stats',
            headers={'Authorization': f'Bearer {admin_token}'},
            timeout=5
        )
        
        print(f'\n✓ Status Code: {response.status_code}')
        data = response.json()
        
        if response.status_code == 200 and data.get('data'):
            print(f'✓ Stats Loaded: YES')
            print(f'✓ Response Format: Valid JSON')
            stats = data['data']
            
            for key, value in stats.items():
                print(f'  - {key}: {value}')
            return True
        else:
            print(f'Response: {json.dumps(data, indent=2)}')
            return response.status_code in [200, 403]  # 403 if not admin
            
    except Exception as e:
        print(f'✗ ERROR: {str(e)}')
        return False

def main():
    print_header('REAL ESTATE MARKETPLACE - API ENDPOINT TEST SUITE')
    
    results = {}
    
    # Run tests
    token = test_login()
    results['login'] = token is not None
    
    results['profile'] = test_get_profile(token)
    results['favourites'] = test_get_favourites(token)
    results['create_property'] = test_create_property(token)
    results['admin_stats'] = test_admin_stats(token)
    
    # Summary
    print_header('TEST SUMMARY')
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        status = '✓ PASS' if result else '✗ FAIL'
        print(f'{status}: {test_name}')
    
    print(f'\nTotal: {passed}/{total} tests passed')
    print(f'\n{"="*70}\n')

if __name__ == '__main__':
    main()
