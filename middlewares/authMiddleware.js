const jwt = require('jsonwebtoken');

// Middleware function to authenticate JWT tokens
const authenticateJWT = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Extract token from Authorization header

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid token' });
      } else {
        req.user = decodedToken; // Attach decoded token to request object
        next(); // Move to the next middleware/route handler
      }
    });
  } else {
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

module.exports = { authenticateJWT };
