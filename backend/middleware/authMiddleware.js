const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your_jwt_secret'; // 실제 시크릿 키로 교체

// 인증 미들웨어
const authMiddleware = (req, res, next) => {
  const token = req.headers['authorization'];
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  jwt.verify(token.split(' ')[1], JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Failed to authenticate token' });
    }
  
    req.user = decoded;
    next();
  });
};


module.exports = authMiddleware;
