import Admin from '../models/Admin.js';
import jwt from 'jsonwebtoken';

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// @desc    Get all sub-admins
// @route   GET /api/admin/sub-admins
// @access  Private (Super Admin only)
export const getAllSubAdmins = async (req, res) => {
  try {
    const subAdmins = await Admin.find({ role: { $ne: 'super_admin' } })
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: subAdmins.length,
      data: subAdmins
    });
  } catch (error) {
    console.error('Get All Sub-Admins Error:', error);
    res.status(500).json({ message: 'Failed to fetch sub-admins', error: error.message });
  }
};

// @desc    Create new sub-admin
// @route   POST /api/admin/sub-admins
// @access  Private (Super Admin only)
export const createSubAdmin = async (req, res) => {
  try {
    const { email, password, name, role, permissions } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Email, password, and name are required' });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin with this email already exists' });
    }

    // Validate role
    const validRoles = ['admin', 'moderator'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Create new sub-admin
    const subAdmin = await Admin.create({
      email: email.toLowerCase(),
      password,
      name,
      role: role || 'admin',
      permissions: permissions || [],
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: 'Sub-admin created successfully',
      data: {
        id: subAdmin._id,
        email: subAdmin.email,
        name: subAdmin.name,
        role: subAdmin.role,
        permissions: subAdmin.permissions,
        isActive: subAdmin.isActive
      }
    });
  } catch (error) {
    console.error('Create Sub-Admin Error:', error);
    res.status(500).json({ message: 'Failed to create sub-admin', error: error.message });
  }
};

// @desc    Update sub-admin
// @route   PUT /api/admin/sub-admins/:id
// @access  Private (Super Admin only)
export const updateSubAdmin = async (req, res) => {
  try {
    const { name, role, permissions, isActive } = req.body;

    const subAdmin = await Admin.findById(req.params.id);

    if (!subAdmin) {
      return res.status(404).json({ message: 'Sub-admin not found' });
    }

    // Prevent updating super admin
    if (subAdmin.role === 'super_admin') {
      return res.status(403).json({ message: 'Cannot update super admin' });
    }

    // Update fields
    if (name) subAdmin.name = name;
    if (role && ['admin', 'moderator'].includes(role)) subAdmin.role = role;
    if (permissions !== undefined) subAdmin.permissions = permissions;
    if (isActive !== undefined) subAdmin.isActive = isActive;

    await subAdmin.save();

    res.status(200).json({
      success: true,
      message: 'Sub-admin updated successfully',
      data: {
        id: subAdmin._id,
        email: subAdmin.email,
        name: subAdmin.name,
        role: subAdmin.role,
        permissions: subAdmin.permissions,
        isActive: subAdmin.isActive
      }
    });
  } catch (error) {
    console.error('Update Sub-Admin Error:', error);
    res.status(500).json({ message: 'Failed to update sub-admin', error: error.message });
  }
};

// @desc    Delete sub-admin
// @route   DELETE /api/admin/sub-admins/:id
// @access  Private (Super Admin only)
export const deleteSubAdmin = async (req, res) => {
  try {
    const subAdmin = await Admin.findById(req.params.id);

    if (!subAdmin) {
      return res.status(404).json({ message: 'Sub-admin not found' });
    }

    // Prevent deleting super admin
    if (subAdmin.role === 'super_admin') {
      return res.status(403).json({ message: 'Cannot delete super admin' });
    }

    await Admin.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Sub-admin deleted successfully'
    });
  } catch (error) {
    console.error('Delete Sub-Admin Error:', error);
    res.status(500).json({ message: 'Failed to delete sub-admin', error: error.message });
  }
};

// @desc    Reset sub-admin password
// @route   PUT /api/admin/sub-admins/:id/reset-password
// @access  Private (Super Admin only)
export const resetSubAdminPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const subAdmin = await Admin.findById(req.params.id);

    if (!subAdmin) {
      return res.status(404).json({ message: 'Sub-admin not found' });
    }

    // Prevent resetting super admin password
    if (subAdmin.role === 'super_admin') {
      return res.status(403).json({ message: 'Cannot reset super admin password' });
    }

    subAdmin.password = newPassword;
    await subAdmin.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({ message: 'Failed to reset password', error: error.message });
  }
};

// @desc    Get current admin info
// @route   GET /api/admin/me
// @access  Private
export const getAdminInfo = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id).select('-password');

    res.status(200).json({
      success: true,
      data: admin
    });
  } catch (error) {
    console.error('Get Admin Info Error:', error);
    res.status(500).json({ message: 'Failed to get admin info', error: error.message });
  }
};
