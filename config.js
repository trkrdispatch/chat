/**
 * Configuration management for the chat application
 * Loads and validates environment variables
 */
require('dotenv').config();

// Define required environment variables
const requiredEnvVars = [
  'PORT',
  'NODE_ENV',
  'OPENAI_API_KEY'
];

// Check for missing required environment variables
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  console.error(`Error: Missing required environment variables: ${missingEnvVars.join(', ')}`);
  console.error('Please check your .env file or environment configuration.');
  process.exit(1);
}

// Configuration object with masked sensitive values for logging
const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  ejabberd: {
    admin: process.env.EJABBERD_ADMIN || 'admin',
    adminPassword: '***masked***', // Masked for security in logs
    apiUrl: process.env.EJABBERD_API_URL || 'http://ejabberd:5280/api'
  },
  openai: {
    apiKey: '***masked***', // Masked for security in logs
    model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '150')
  },
  // Actual values for application use (not for logging)
  _secrets: {
    ejabberdAdminPassword: process.env.EJABBERD_ADMIN_PASSWORD,
    openaiApiKey: process.env.OPENAI_API_KEY
  }
};

// Safe getter for accessing actual secret values
config.getSecret = function(key) {
  if (!this._secrets[key]) {
    console.warn(`Warning: Attempting to access undefined secret: ${key}`);
    return null;
  }
  return this._secrets[key];
};

// For debugging, print masked config (without sensitive values)
if (process.env.NODE_ENV === 'development') {
  const debugConfig = { ...config };
  delete debugConfig._secrets; // Remove secrets entirely from debug output
  delete debugConfig.getSecret; // Remove the method from debug output
  console.log('Application configuration loaded:', debugConfig);
}

module.exports = config; 