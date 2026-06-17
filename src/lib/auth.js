import jwt from 'jsonwebtoken';

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.warn('WARNING: JWT_SECRET environment variable is missing');
    return 'fallback_secret_for_build_only';
  }
  return secret;
};

export function signToken(payload) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '24h' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, getJwtSecret());
  } catch (error) {
    return null;
  }
}

/**
 * Extracts and verifies the JWT token from the Request headers or cookies.
 * @param {Request} req The incoming request
 * @returns {object|null} The verified payload or null if unauthorized
 */
export async function verifyAuth(req) {
  try {
    let token = null;

    // 1. Try to get token from Authorization header
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const extractedToken = authHeader.substring(7);
      if (extractedToken !== 'null' && extractedToken !== 'undefined' && extractedToken !== '') {
        token = extractedToken;
      }
    }

    // 2. Try to get token from cookies
    if (!token) {
      const cookieHeader = req.headers.get('cookie') || '';
      const tokenCookie = cookieHeader
        .split(';')
        .find((cookie) => cookie.trim().startsWith('token='));
      if (tokenCookie) {
        token = tokenCookie.substring(tokenCookie.indexOf('=') + 1).trim();
      }
    }

    if (!token) {
      return null;
    }

    return verifyToken(token);
  } catch (err) {
    return null;
  }
}
