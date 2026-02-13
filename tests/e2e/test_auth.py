"""E2E tests for authentication functionality."""
import pytest
from playwright.sync_api import Page, expect


@pytest.mark.auth
@pytest.mark.smoke
def test_login_page_loads(page: Page, base_url: str):
    """Test that login page loads correctly."""
    page.goto(f'{base_url}/auth/login')

    expect(page).to_have_title('Job Application Tracker')
    expect(page.locator('input[type="email"]')).to_be_visible()
    expect(page.locator('input[type="password"]')).to_be_visible()
    expect(page.locator('button[type="submit"]')).to_be_visible()


@pytest.mark.auth
def test_signup_page_loads(page: Page, base_url: str):
    """Test that signup page loads correctly."""
    page.goto(f'{base_url}/auth/signup')

    expect(page).to_have_title('Job Application Tracker')
    expect(page.locator('input[type="email"]')).to_be_visible()
    expect(page.locator('input[id="password"]')).to_be_visible()
    expect(page.locator('input[id="confirm-password"]')).to_be_visible()


@pytest.mark.auth
@pytest.mark.critical
def test_unauthenticated_redirect(page: Page, base_url: str):
    """Test that unauthenticated users are redirected to login."""
    page.goto(base_url)

    # Should redirect to login
    page.wait_for_url(f'{base_url}/auth/login', timeout=5000)
    expect(page).to_have_url(f'{base_url}/auth/login')
