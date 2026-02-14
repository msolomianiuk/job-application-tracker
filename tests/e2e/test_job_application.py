"""E2E tests for job application functionality."""
import pytest
import allure
from playwright.sync_api import Page, expect


@allure.feature('Job Applications')
@allure.story('Add Job')
@allure.severity(allure.severity_level.CRITICAL)
@pytest.mark.smoke
def test_add_job_application(authenticated_page: Page):
    """Test adding a new job application."""
    page = authenticated_page

    # Fill in job application form
    page.fill('input[placeholder*="https://example.com"]',
              'https://example.com/job/test-qa-engineer')
    page.fill('input[placeholder*="QA Automation Engineer"]',
              'Senior QA Engineer')
    page.fill('input[placeholder*="Acme Inc"]', 'TestCompanyAdd')

    # Select status
    page.select_option('select#status', 'applied')

    # Add notes
    page.fill('textarea[placeholder*="notes"]',
              'Test job application created by E2E test')

    # Submit form
    page.click('button:has-text("Add Job Application")')

    # Verify job was added
    locator = page.locator(
        '.text-lg.font-semibold:has-text("Senior QA Engineer")'
    )
    expect(locator).to_be_visible(timeout=10000)


@allure.feature('Job Applications')
@allure.story('Form Validation')
@allure.severity(allure.severity_level.CRITICAL)
@pytest.mark.critical
def test_job_application_required_fields(authenticated_page: Page):
    """Test that required fields are enforced."""
    page = authenticated_page

    # Try to submit without URL
    locator = page.locator('button:has-text("Add Job Application")')
    submit_button = locator
    expect(submit_button).to_be_disabled()

    # Add URL
    page.fill('input[placeholder*="https://example.com"]',
              'https://example.com/job/test')

    # Still disabled without company name
    expect(submit_button).to_be_disabled()

    # Add company name
    page.fill('input[placeholder*="Acme Inc"]', 'Test Company')

    # Now should be enabled
    expect(submit_button).to_be_enabled()


@allure.feature('Job Applications')
@allure.story('Search')
@allure.severity(allure.severity_level.NORMAL)
@pytest.mark.smoke
def test_search_job_applications(authenticated_page: Page):
    """Test searching for job applications."""
    page = authenticated_page

    # Add a test job first
    page.fill('input[placeholder*="https://example.com"]',
              'https://example.com/job/searchable')
    page.fill('input[placeholder*="Acme Inc"]', 'Searchable Company')
    page.click('button:has-text("Add Job Application")')

    # Wait for job to appear
    expect(page.locator('text=Searchable Company')).to_be_visible()

    # Search for the job
    search_input = page.locator('input[placeholder*="Search jobs"]')
    search_input.fill('Searchable')

    # Verify filtered results
    expect(page.locator('text=Searchable Company')).to_be_visible()

    # Clear search
    page.click('button[aria-label="Clear search"]')
    expect(search_input).to_have_value('')


@allure.feature('Job Applications')
@allure.story('Filter')
@allure.severity(allure.severity_level.NORMAL)
def test_filter_by_status(authenticated_page: Page):
    """Test filtering jobs by status."""
    page = authenticated_page

    # Add a job with 'applied' status first
    page.fill('input[placeholder*="https://example.com"]',
              'https://example.com/job/filter-test')
    page.fill('input[placeholder*="Acme Inc"]', 'Filter Test Company')
    page.select_option('select#status', 'applied')
    page.click('button:has-text("Add Job Application")')

    # Wait for job to appear
    expect(page.locator('text=Filter Test Company')).to_be_visible()

    # Select filter
    page.select_option('select:has-text("All Status")', 'applied')

    # Verify the job is still visible
    expect(page.locator('text=Filter Test Company')).to_be_visible()


@allure.feature('Job Applications')
@allure.story('Export')
@allure.severity(allure.severity_level.MINOR)
def test_export_to_html(authenticated_page: Page):
    """Test exporting jobs to HTML."""
    page = authenticated_page

    # Click export button and capture download
    with page.expect_download() as download_info:
        page.click('button:has-text("Export HTML")')

    download = download_info.value

    # Verify download
    assert download.suggested_filename.startswith('job-applications-')
    assert download.suggested_filename.endswith('.html')


@allure.feature('Job Applications')
@allure.story('Edit Job')
@allure.severity(allure.severity_level.CRITICAL)
@pytest.mark.critical
def test_edit_job_application(authenticated_page: Page):
    """Test editing an existing job application."""
    page = authenticated_page

    # Generate unique identifiers to avoid duplicate URL conflicts
    import time
    timestamp = str(int(time.time() * 1000))
    unique_url = f'https://example.com/job/editable-test-{timestamp}'
    unique_company = f'EditableTestCo{timestamp[-6:]}'
    updated_company = f'UpdatedTestCo{timestamp[-6:]}'

    # Add a job first
    page.fill('input[placeholder*="https://example.com"]', unique_url)
    page.fill('input[placeholder*="Acme Inc"]', unique_company)

    submit_button = page.locator('button:has-text("Add Job Application")')
    expect(submit_button).to_be_enabled(timeout=5000)
    submit_button.click()

    # Wait for job to appear in the list
    locator = page.locator(f'.bg-white:has-text("{unique_company}")')
    expect(locator).to_be_visible(timeout=15000)

    # Click Edit button
    job_locator = page.locator(f'.bg-white:has-text("{unique_company}")')
    job_locator.locator('button:has-text("Edit")').click()

    # Wait for edit form and modify company name
    page.wait_for_selector('label:has-text("Company")', timeout=5000)
    label_locator = page.locator('label:has-text("Company")')
    company_input = label_locator.locator('..').locator('input').last
    company_input.fill(updated_company)

    # Save changes
    page.locator('button:has-text("Save")').first.click()

    # Verify changes - wait for the updated name to appear
    locator = page.locator(f'.bg-white:has-text("{updated_company}")')
    expect(locator).to_be_visible(timeout=10000)


@allure.feature('Job Applications')
@allure.story('Delete Job')
@allure.severity(allure.severity_level.NORMAL)
def test_delete_job_application(authenticated_page: Page):
    """Test deleting a job application."""
    page = authenticated_page

    # Add a job first
    page.fill('input[placeholder*="https://example.com"]',
              'https://example.com/job/deletable')
    page.fill('input[placeholder*="Acme Inc"]', 'Deletable Company')
    page.click('button:has-text("Add Job Application")')

    # Wait for job to appear
    expect(page.locator('text=Deletable Company')).to_be_visible()

    # Find the job card and click Delete button
    job_card = page.locator(
        '.bg-white').filter(has_text='Deletable Company')
    job_card.locator('button:has-text("Delete")').click()

    # Confirm deletion
    page.click('button:has-text("Confirm")')

    # Verify job is removed
    expect(page.locator('text=Deletable Company')).not_to_be_visible()
