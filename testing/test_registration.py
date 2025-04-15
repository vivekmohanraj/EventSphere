import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

class TestRegistration:
    def setup_method(self, method):
        # Configure Chrome options to mitigate sandbox issues
        chrome_options = Options()
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        
        # Initialize ChromeDriver
        self.driver = webdriver.Chrome(options=chrome_options)
        self.vars = {}

    def teardown_method(self, method):
        # Clean up by quitting the browser
        self.driver.quit()

    def test_registration(self):
        # Navigate to the application
        self.driver.get("http://localhost:5173/")
        self.driver.set_window_size(1082, 816)
        
        # Click the CTA button
        cta_button = WebDriverWait(self.driver, 10).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, ".cta-btn"))
        )
        cta_button.click()
        
        # Click the Register link (assuming text-based or stable selector)
        register_link = WebDriverWait(self.driver, 10).until(
            EC.element_to_be_clickable((By.XPATH, "//a[contains(text(), 'Register')]"))
        )
        self.driver.execute_script("arguments[0].scrollIntoView(true);", register_link)
        register_link.click()
        
        # Click the button to start registration (assuming it's a "Sign up with Email" button)
        signup_button = WebDriverWait(self.driver, 10).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, ".btn-outline-primary"))
        )
        signup_button.click()
        
        # Fill out the registration form
        WebDriverWait(self.driver, 10).until(
            EC.presence_of_element_located((By.NAME, "firstName"))
        )
        self.driver.find_element(By.NAME, "firstName").send_keys("Roja")
        self.driver.find_element(By.NAME, "lastName").send_keys("Mohan Raj")
        self.driver.find_element(By.NAME, "username").send_keys("rojamohanraj")
        self.driver.find_element(By.NAME, "email").send_keys("rojamohanraj@gmail.com")
        self.driver.find_element(By.NAME, "phoneNumber").send_keys("9579844618")
        self.driver.find_element(By.NAME, "password").send_keys("Roja@123")
        self.driver.find_element(By.NAME, "confirmPassword").send_keys("Roja@123")
        
        # Click the submit button (assuming a more stable selector)
        submit_button = WebDriverWait(self.driver, 10).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, "button[type='submit']"))
        )
        self.driver.execute_script("arguments[0].scrollIntoView(true);", submit_button)
        submit_button.click()
        
        # Verify registration success
        success_message = WebDriverWait(self.driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, ".success-message"))
        )
        assert "success" in success_message.text.lower(), "Registration failed: Success message not found"