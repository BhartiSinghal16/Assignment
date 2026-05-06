const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Verify JWT and attach user to req
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id, { attributes: { exclude: ['password'] } });
    if (!user) return res.status(401).json({ message: 'User not found' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Restrict to global admins only
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Restrict to project admin or global admin
const requireProjectAdmin = async (req, res, next) => {
  const { ProjectMember } = require('../models');
  const projectId = req.params.id || req.params.projectId;
  if (req.user.role === 'admin') return next();
  const membership = await ProjectMember.findOne({
    where: { projectId, userId: req.user.id, role: 'admin' },
  });
  if (!membership) return res.status(403).json({ message: 'Project admin access required' });
  next();
};

module.exports = { authenticate, requireAdmin, requireProjectAdmin };
