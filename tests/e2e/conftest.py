"""Pytest configuration and fixtures for E2E tests."""
import requests
import os
import pytest
import json
import uuid
from pathlib import Path
from playwright.sync_api import Page, BrowserContext
from dotenv import load_dotenv

load_dotenv('.env.local')


@pytest.fixture(scope='session')
def browser_context_args(browser_context_args):
    """Configure browser context with viewport and other settings."""
    return {
        **browser_context_args,
        'viewport': {'width': 1920, 'height': 1080},
        'ignore_https_errors': True,
    }


@pytest.fixture
def context(context: BrowserContext):
    """Provide browser context with extended timeout."""
    context.set_default_timeout(30000)
    yield context


@pytest.fixture(autouse=True)
def capture_coverage(page: Page):
    """
    Auto-fixture that runs after every test.
    It extracts the window.__coverage__ object from the browser
    and saves it to a .nyc_output directory.
    """
    yield  # Run the test

    try:
        # Create output directory regardless of coverage presence
        output_dir = Path('.nyc_output')
        output_dir.mkdir(exist_ok=True)

        # 1. Check if coverage exists
        coverage = page.evaluate('return window.__coverage__ || null')

        if coverage:
            # 2. Save to a unique file
            filename = output_dir / f"coverage-{uuid.uuid4()}.json"

            with open(filename, "w") as f:
                json.dump(coverage, f)
            print(f"Coverage captured for test to {filename}")
        else:
            print("No coverage data found in window.__coverage__")
            
    except Exception as e:
        print(f"Coverage capture warning: {e}")


@pytest.fixture
def authenticated_page(page: Page, base_url: str):
    """Provide an authenticated page for tests that require login."""
    # Navigate to login page
    page.goto(f'{base_url}/auth/login')

    # Fill in credentials from environment
    email = os.getenv('TEST_USER_EMAIL')
    password = os.getenv('TEST_USER_PASSWORD')

    if not email or not password:
        pytest.skip('TEST_USER_EMAIL and TEST_USER_PASSWORD must be set')

    # Perform login
    page.fill('input[type="email"]', email)
    page.fill('input[type="password"]', password)
    page.click('button[type="submit"]')

    # Wait for navigation to complete
    page.wait_for_url(f'{base_url}/', timeout=10000)

    yield page

    # Cleanup: Delete all jobs for the test user from database using raw REST API
    # This avoids compatibility issues with the supabase-py client on some Python versions
    try:
        import requests
        
        url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
        key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

        print(f"Cleanup Debug: URL present? {bool(url)}, Key present? {bool(key)}")

        if url and key:
            # 1. Authenticate to get the access token
            auth_url = f"{url}/auth/v1/token?grant_type=password"
            headers = {
                "apikey": key,
                "Content-Type": "application/json"
            }
            payload = {
                "email": email,
                "password": password
            }
            
            print(f"Cleanup Debug: Attempting login for {email} via REST API")
            auth_res = requests.post(auth_url, headers=headers, json=payload)
            
            if auth_res.status_code == 200:
                auth_data = auth_res.json()
                access_token = auth_data.get("access_token")
                user_id = auth_data.get("user", {}).get("id")
                
                if access_token and user_id:
                    print(f"Cleanup: Logged in as user {email} ({user_id})")
                    
                    # 2. Delete jobs using the access token
                    # REST API: DELETE /rest/v1/jobs?user_id=eq.UUID
                    delete_url = f"{url}/rest/v1/jobs?user_id=eq.{user_id}"
                    delete_headers = {
                        "apikey": key,
                        "Authorization": f"Bearer {access_token}",
                        "Content-Type": "application/json",
                        "Prefer": "return=representation" # To get the count of deleted rows
                    }
                    
                    print(f"Cleanup: Deleting jobs for user_id={user_id}...")
                    del_res = requests.delete(delete_url, headers=delete_headers)
                    
                    if del_res.status_code in (200, 204):
                        # If we asked for representation, we might get the deleted rows back
                        deleted_data = del_res.json() if del_res.content else []
                        count = len(deleted_data)
                        print(f"Cleanup: Successfully deleted {count} jobs for user {email}")
                    else:
                        print(f"Cleanup error: Delete failed with status {del_res.status_code}: {del_res.text}")
                else:
                     print("Cleanup warning: Login successful but missing token/user_id")
            else:
                print(f"Cleanup warning: Login failed with status {auth_res.status_code}: {auth_res.text}")
        else:
            print("Cleanup warning: Missing Supabase URL or Key in env vars")
            
    except Exception as e:
        # Log but don't fail the test on cleanup errors
        print(f'Cleanup warning: {e}')
