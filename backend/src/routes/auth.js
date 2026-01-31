import express from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { config } from '../config.js';

const router = express.Router();

const ROLES = ['IT', 'HR', 'Finance', 'Customer Support', 'Legal', 'Admin', 'Manager', 'Agent'];

const ROLE_LABELS = {
  IT: 'Technical Head (IT)',
  HR: 'HR Manager (HR)',
  Finance: 'Finance Lead (Finance)',
  'Customer Support': 'Support Lead (Customer Support)',
  Legal: 'Legal Counsel (Legal)',
  Admin: 'Administrator (Admin)',
  Manager: 'Manager (Management)',
  Agent: 'Support Agent (Agent)',
};

function signToken(user) {
  return jwt.sign(
    { userId: user._id.toString(), email: user.email },
    config.jwtSecret,
    { expiresIn: '7d' }
  );
}

function isNameValid(name) {
  return /^[a-zA-Z\s'-]+$/.test(name) && name.trim().length >= 2;
}

function getPasswordStrengthErrors(password) {
  const errors = [];
  if (password.length < 8) errors.push('at least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('one uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('one lowercase letter');
  if (!/[0-9]/.test(password)) errors.push('one number');
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) errors.push('one special character (!@#$%^&* etc.)');
  return errors;
}

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, confirmPassword, role, department } = req.body;
    if (!name || !email || !password || !confirmPassword || !role) {
      return res.status(400).json({ error: 'Name, email, password, confirm password and role are required' });
    }
    if (!isNameValid(name.trim())) {
      return res.status(400).json({ error: 'Full name must contain only letters (no numbers). Spaces and hyphens are allowed.' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }
    const pwdErrors = getPasswordStrengthErrors(password);
    if (pwdErrors.length > 0) {
      return res.status(400).json({
        error: `Password must be strong. Use: ${pwdErrors.join(', ')}.`,
      });
    }
    if (!ROLES.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    const dept = department && ROLES.includes(department) ? department : role;
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    const user = await User.create({ name: name.trim(), email: email.toLowerCase(), password, role, department: dept });
    const token = signToken(user);
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const match = await user.comparePassword(password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = signToken(user);
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Login failed' });
  }
});

router.get('/roles', (req, res) => {
  res.json({
    roles: ROLES,
    roleLabels: ROLE_LABELS,
    departments: ROLES,
  });
});

export default router;
