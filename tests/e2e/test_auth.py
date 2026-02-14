"""E2E tests for authentication functionality."""
import pytest
import allure
from playwright.sync_api import Page, expect


@allure.feature('Authentication')
@allure.story('Login Page')
@allure.severity(allure.severity_level.CRITICAL)
@pytest.mark.auth
@pytest.mark.smoke
def test_login_page_loads(page: Page, base_url: str):
    """Test that login page loads correctly."""
    # Navigate to login page
    page.goto(f'{base_url}/auth/login')

    # Verify page elements
    expect(page).to_have_title('Job Application Tracker')
    expect(page.locator('input[type="email"]')).to_be_visible()
    expect(page.locator('input[type="password"]')).to_be_visible()
    expect(page.locator('button[type="submit"]')).to_be_visible()


@allure.feature('Authentication')
@allure.story('Signup Page')
@allure.severity(allure.severity_level.NORMAL)
@pytest.mark.auth
def test_signup_page_loads(page: Page, base_url: str):
    """Test that signup page loads correctly."""
    # Navigate to signup page
    page.goto(f'{base_url}/auth/signup')

    # Verify page elements
    expect(page).to_have_title('Job Application Tracker')
    expect(page.locator('input[type="email"]')).to_be_visible()
    expect(page.locator('input[id="password"]')).to_be_visible()
    expect(page.locator('input[id="confirm-password"]')).to_be_visible()


@allure.feature('Authentication')
@allure.story('Access Control')
@allure.severity(allure.severity_level.CRITICAL)
@pytest.mark.auth
@pytest.mark.critical
def test_unauthenticated_redirect(page: Page, base_url: str):
    """Test that unauthenticated users are redirected to login."""
    # Navigate to home page without authentication
    page.goto(base_url)

    # Should redirect to login
    page.wait_for_url(f'{base_url}/auth/login', timeout=5000)
    expect(page).to_have_url(f'{base_url}/auth/login')
