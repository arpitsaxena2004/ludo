import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from '../models/Admin.js';

dotenv.config();

const updateAdminPermissions = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@kheloludo.com';
        const admin = await Admin.findOne({ email: adminEmail });
        
        if (admin) {
            admin.permissions = [
                'manage_users',
                'manage_games',
                'manage_deposits',
                'manage_withdrawals',
                'manage_transactions',
                'manage_kyc',
                'manage_support',
                'manage_settings',
                'view_analytics',
                'manage_admins'
            ];
            await admin.save();
            console.log(`Successfully updated permissions for ${adminEmail}`);
        } else {
            console.log(`Admin ${adminEmail} not found!`);
        }
    } catch (error) {
        console.error('Error updating admin permissions:', error);
    } finally {
        process.exit(0);
    }
};

updateAdminPermissions();
