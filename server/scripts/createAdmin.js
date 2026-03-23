import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import Admin from '../models/Admin.js';

dotenv.config();

const createDefaultAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: process.env.ADMIN_EMAIL || 'admin@a2zludo.com' });
    
    if (existingAdmin) {
      console.log('Admin user already exists!');
      console.log('Email:', existingAdmin.email);
      process.exit(0);
    }

    // Create new admin
    const admin = await Admin.create({
      email: process.env.ADMIN_EMAIL || 'admin@a2zludo.com',
      password: process.env.ADMIN_PASSWORD || 'admin123',
      name: 'Super Admin',
      role: 'super_admin',
      permissions: [
        'manage_users',
        'manage_games',
        'manage_transactions',
        'manage_kyc',
        'manage_support',
        'manage_settings',
        'view_analytics',
        'manage_admins'
      ],
      isActive: true
    });

    console.log('\n✅ Admin user created successfully!');
    console.log('Email:', admin.email);
    console.log('Password:', process.env.ADMIN_PASSWORD || 'admin123');
    console.log('\n⚠️  Please change the password after first login!\n');

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
};

createDefaultAdmin();
