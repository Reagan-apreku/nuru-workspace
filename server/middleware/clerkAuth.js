const { clerkMiddleware, getAuth } = require('@clerk/express');

// Base Clerk middleware — attaches auth info to requests
const clerkBase = clerkMiddleware();

// Require authentication — returns 401 if not signed in
const requireClerkAuth = (req, res, next) => {
  const auth = getAuth(req);
  if (!auth.userId) {
    return res.status(401).json({ error: 'Unauthenticated' });
  }
  next();
};

module.exports = { clerkBase, requireClerkAuth };
