const crypto = require('crypto');
const axios = require('axios');

/**
 * Canva OAuth 2.0 Authentication Service
 * Implements PKCE (Proof Key for Code Exchange) flow
 */

const CANVA_AUTH_URL = 'https://www.canva.com/api/oauth/authorize';
const CANVA_TOKEN_URL = 'https://api.canva.com/rest/v1/oauth/token';

// Store for code verifiers (in production, use Redis or database)
const codeVerifierStore = new Map();
const stateStore = new Map();

/**
 * Generate cryptographically secure random string for PKCE
 */
function generateRandomString(length = 128) {
  return crypto.randomBytes(length).toString('base64url');
}

/**
 * Generate code verifier for PKCE
 * @returns {string} - Base64 URL-encoded random string (43-128 chars)
 */
function generateCodeVerifier() {
  return generateRandomString(96); // 96 bytes = 128 base64url chars
}

/**
 * Generate code challenge from code verifier
 * @param {string} codeVerifier - The code verifier string
 * @returns {string} - SHA-256 hash of verifier, base64url encoded
 */
function generateCodeChallenge(codeVerifier) {
  return crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');
}

/**
 * Generate state parameter for CSRF protection
 * @returns {string} - Base64 URL-encoded random string
 */
function generateState() {
  return generateRandomString(96);
}

/**
 * Generate Canva authorization URL
 * @param {Object} options - Configuration options
 * @param {string} options.clientId - Canva client ID
 * @param {string} options.redirectUri - Redirect URI after authorization
 * @param {string[]} options.scopes - Array of required scopes
 * @returns {Object} - { url, codeVerifier, state }
 */
function generateAuthorizationUrl(options) {
  const { clientId, redirectUri, scopes } = options;
  
  // Generate PKCE parameters
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  const state = generateState();
  
  // Store for later verification
  codeVerifierStore.set(state, codeVerifier);
  stateStore.set(state, true);
  
  // Build authorization URL
  const params = new URLSearchParams({
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    scope: scopes.join(' '),
    response_type: 'code',
    client_id: clientId,
    state: state,
    redirect_uri: redirectUri
  });
  
  const authUrl = `${CANVA_AUTH_URL}?${params.toString()}`;
  
  return {
    url: authUrl,
    codeVerifier,
    state
  };
}

/**
 * Exchange authorization code for access token
 * @param {Object} options - Configuration options
 * @param {string} options.code - Authorization code from callback
 * @param {string} options.state - State parameter from callback
 * @param {string} options.clientId - Canva client ID
 * @param {string} options.clientSecret - Canva client secret
 * @param {string} options.redirectUri - Redirect URI used in authorization
 * @returns {Promise<Object>} - { access_token, refresh_token, expires_in, scope }
 */
async function exchangeCodeForToken(options) {
  const { code, state, clientId, clientSecret, redirectUri } = options;
  
  // Verify state to prevent CSRF
  if (!stateStore.has(state)) {
    throw new Error('Invalid state parameter - possible CSRF attack');
  }
  
  // Get stored code verifier
  const codeVerifier = codeVerifierStore.get(state);
  if (!codeVerifier) {
    throw new Error('Code verifier not found for state');
  }
  
  // Clean up stored values
  codeVerifierStore.delete(state);
  stateStore.delete(state);
  
  // Basic auth credentials
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  
  try {
    const response = await axios.post(
      CANVA_TOKEN_URL,
      new URLSearchParams({
        grant_type: 'authorization_code',
        code_verifier: codeVerifier,
        code: code,
        redirect_uri: redirectUri
      }),
      {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    throw new Error(`Failed to exchange code for token: ${error.message}`);
  }
}

/**
 * Refresh an access token using refresh token
 * @param {Object} options - Configuration options
 * @param {string} options.refreshToken - Refresh token from previous authorization
 * @param {string} options.clientId - Canva client ID
 * @param {string} options.clientSecret - Canva client secret
 * @returns {Promise<Object>} - { access_token, refresh_token, expires_in, scope }
 */
async function refreshAccessToken(options) {
  const { refreshToken, clientId, clientSecret } = options;
  
  // Basic auth credentials
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  
  try {
    const response = await axios.post(
      CANVA_TOKEN_URL,
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      }),
      {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    throw new Error(`Failed to refresh access token: ${error.message}`);
  }
}

module.exports = {
  generateAuthorizationUrl,
  exchangeCodeForToken,
  refreshAccessToken,
  generateCodeVerifier,
  generateCodeChallenge,
  generateState
};
