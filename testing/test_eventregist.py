# Generated by Selenium IDE
import pytest
import time
import json
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support import expected_conditions
from selenium.webdriver.support.wait import WebDriverWait
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities

class TestEventregist():
  def setup_method(self, method):
    self.driver = webdriver.Chrome()
    self.vars = {}
  
  def teardown_method(self, method):
    self.driver.quit()
  
  def test_eventregist(self):
    self.driver.get("http://localhost:5173/")
    self.driver.set_window_size(1082, 816)
    self.driver.find_element(By.CSS_SELECTOR, ".mobile-nav-toggle").click()
    self.driver.find_element(By.ID, "navmenu").click()
    self.driver.find_element(By.CSS_SELECTOR, ".mobile-nav-toggle").click()
    self.driver.find_element(By.CSS_SELECTOR, ".cta-btn").click()
    self.driver.find_element(By.NAME, "login").click()
    self.driver.find_element(By.NAME, "login").send_keys("poojamohanraj@gmail.com")
    self.driver.find_element(By.NAME, "password").click()
    self.driver.find_element(By.NAME, "password").send_keys("Pooja@123")
    self.driver.find_element(By.NAME, "password").send_keys(Keys.ENTER)
    self.driver.find_element(By.CSS_SELECTOR, ".btn-get-started").click()
    self.driver.find_element(By.CSS_SELECTOR, ".\\_eventCard_trp07_133:nth-child(2) .\\_viewDetails_trp07_233").click()
    self.driver.execute_script("window.scrollTo(0,460.79998779296875)")
    self.driver.find_element(By.CSS_SELECTOR, ".\\_backButton_1r6r0_497").click()
    self.driver.execute_script("window.scrollTo(0,1141.5999755859375)")
    self.driver.find_element(By.CSS_SELECTOR, ".\\_eventCard_trp07_133:nth-child(4) .\\_viewDetails_trp07_233").click()
    self.driver.execute_script("window.scrollTo(0,0)")
    self.driver.find_element(By.CSS_SELECTOR, ".\\_backButton_1r6r0_497").click()
    self.driver.execute_script("window.scrollTo(0,1046.4000244140625)")
    self.driver.find_element(By.CSS_SELECTOR, ".\\_eventCard_trp07_133:nth-child(3) .\\_viewDetails_trp07_233").click()
    self.driver.execute_script("window.scrollTo(0,1696.800048828125)")
    self.driver.find_element(By.CSS_SELECTOR, ".\\_registerButton_1r6r0_495").click()
    self.driver.execute_script("window.scrollTo(0,1740.800048828125)")
    self.driver.close()
  
