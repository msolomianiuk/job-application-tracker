"""Pytest configuration and fixtures for E2E tests."""
import os
import pytest
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

    # Cleanup: Delete all jobs for the test user from database
    try:
        try:
            from supabase import create_client
        except ImportError:
            from supabase.client import create_client

        url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
        key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

        if url and key:
            # Create client and authenticate
            supabase = create_client(url.strip(), key.strip())
            auth_response = supabase.auth.sign_in_with_password({
                'email': email,
                'password': password
            })

            if auth_response.user and auth_response.user.id:
                # Delete all jobs for this user
                try:
                    user_id = auth_response.user.id
                    print(f"Cleanup: Preparing to delete jobs for user {email} ({user_id})")

                    # Use 'jobs' table and explicitly filter by user_id
                    # This ensures we NEVER drop the whole table or other users' data
                    response = supabase.table('jobs').delete().eq(
                        'user_id', user_id
                    ).execute()

                    count = len(response.data) if response.data else 0
                    print(f"Cleanup: Successfully deleted {count} jobs for user {email}")
                except Exception as e:
                    print(f"Cleanup error during deletion: {e}")
            else:
                print("Cleanup warning: No user found in auth response, skipping cleanup")
    except Exception as e:
        # Log but don't fail the test on cleanup errors
        print(f'Cleanup warning: {e}')
