export function adminMiddleware(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  if (!req.user.admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}
