// utils/googleAuth.js
const fetch = require('node-fetch');
const jwt = require('jsonwebtoken'); // JWT library for verification
const jose = require('node-jose'); // JSON Web Key (JWK) handling library

// below code is verifying id token
exports.verifyIdToken = async (token) => {
  const GOOGLE_KEYS_URL = 'https://www.googleapis.com/oauth2/v3/certs';

  try {
    const response = await fetch(GOOGLE_KEYS_URL);
    const { keys } = await response.json();

    const header = JSON.parse(Buffer.from(token.split('.')[0], 'base64').toString());
    const key = keys.find(k => k.kid === header.kid);

    if (!key) {
      throw new Error('Public key not found for the provided token');
    }

    const jwk = {
      kty: key.kty,
      n: key.n,
      e: key.e
    };

    const keyStore = jose.JWK.createKeyStore();
    const publicKey = await keyStore.add(jwk, 'jwk');

    const payload = jwt.verify(token, publicKey.toPEM(), { algorithms: ['RS256'] });
    return { status: 'success', user: payload };
  } catch (error) {
    return { status: 'error', message: error.message };
  }
};
