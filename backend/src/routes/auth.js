import { Router } from 'express';
import { User } from '../models/User.js';
import { generateToken, requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Register new user (first user becomes admin, or admin can create users)
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, display_name } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if this is the first user (make them admin)
    const userCount = await User.count();
    const role = userCount === 0 ? 'admin' : 'user';

    const user = await User.create({
      username,
      email,
      password,
      display_name,
      role
    });

    const token = generateToken(user);

    res.status(201).json({
      message: 'User created successfully',
      user,
      token
    });
  } catch (error) {
    if (error.message.includes('already exists')) {
      return res.status(409).json({ error: error.message });
    }
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await User.verifyPassword(username, password);

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      user,
      token
    });
  } catch (error) {
    if (error.message === 'Account is disabled') {
      return res.status(403).json({ error: error.message });
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Update current user profile
router.put('/me', requireAuth, async (req, res) => {
  try {
    const { display_name, email } = req.body;

    const user = await User.update(req.user.id, { display_name, email });

    res.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Change password
router.post('/change-password', requireAuth, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    // Verify current password
    const user = await User.findByUsername(req.user.username);
    const isValid = await User.verifyPassword(req.user.username, current_password);

    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    await User.updatePassword(req.user.id, new_password);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Admin: Get all users
router.get('/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const users = await User.getAll();
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Admin: Create user
router.post('/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { username, email, password, display_name, role } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await User.create({
      username,
      email,
      password,
      display_name,
      role: role || 'user'
    });

    res.status(201).json(user);
  } catch (error) {
    if (error.message.includes('already exists')) {
      return res.status(409).json({ error: error.message });
    }
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Admin: Update user
router.put('/users/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { display_name, email, role, is_active } = req.body;

    const user = await User.update(req.params.id, {
      display_name,
      email,
      role,
      is_active
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Admin: Delete user
router.delete('/users/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    // Prevent self-deletion
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const user = await User.delete(req.params.id);
    res.json({ message: 'User deleted', user });
  } catch (error) {
    if (error.message === 'User not found') {
      return res.status(404).json({ error: error.message });
    }
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
