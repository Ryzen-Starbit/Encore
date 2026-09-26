import { auth } from '../config/firebaseAdmin.js';
export async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  if (!token) {
    return res.status(401).json({ error: 'No auth token provided' });
  }
  try {
    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken; 
    next();
  } catch (err) {
    console.error('Token verification failed:', err.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export async function optionalAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  if (!token) return next();
  try {
    req.user = await auth.verifyIdToken(token);
  } catch (err) {
  }
  next();
}
