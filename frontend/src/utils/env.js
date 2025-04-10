/**
 * Utility functions for environment variable management
 */

// Log all available VITE_ environment variables (without exposing values)
export const logEnvironmentVariables = () => {
  
  // Get all keys from import.meta.env
  const envKeys = Object.keys(import.meta.env);
  
  // Filter for VITE_ prefixed variables
  const viteEnvKeys = envKeys.filter(key => key.startsWith('VITE_'));
  
  // Log the keys and whether they have values
  viteEnvKeys.forEach(key => {
    const value = import.meta.env[key];
  });
  
  return viteEnvKeys.length > 0;
};

// Check if a specific environment variable exists and has a value
export const checkEnvVariable = (key) => {
  if (!key.startsWith('VITE_')) {
    key = `VITE_${key}`;
  }
  
  const value = import.meta.env[key];
  const exists = !!value;
  
  console.log(`Environment variable ${key}: ${exists ? 'Exists' : 'Missing'}`);
  return exists;
};

// Get environment variable with fallback
export const getEnv = (key, fallback = '') => {
  if (!key.startsWith('VITE_')) {
    key = `VITE_${key}`;
  }
  
  return import.meta.env[key] || fallback;
};

export default {
  logEnvironmentVariables,
  checkEnvVariable,
  getEnv
}; 