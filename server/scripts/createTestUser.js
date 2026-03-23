import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const generateRandomPhone = () => {
  // Generate random 10-digit phone number starting with 6-9
  const firstDigit = Math.floor(Math.random() * 4) + 6; // 6, 7, 8, or 9
  const remainingDigits = Math.floor(Math.random() * 900000000) + 100000000;
  return `${firstDigit}${remainingDigits}`;
};

const generateUsername = () => {
  const adjectives = ['Cool', 'Super', 'Mega', 'Ultra', 'Pro', 'Epic', 'Legendary', 'Master', 'Elite', 'Champion'];
  const nouns = ['Player', 'Gamer', 'Winner', 'King', 'Queen', 'Star', 'Hero', 'Legend', 'Warrior', 'Fighter'];
  const randomNum = Math.floor(Math.random() * 1000);
  
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  
  return `${adjective}${noun}${randomNum}`;
};

const generateReferralCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

const createTestUser = async (count = 1) => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const users = [];

    for (let i = 0; i < count; i++) {
      const phoneNumber = generateRandomPhone();
      const username = generateUsername();
      const referralCode = generateReferralCode();

      // Check if phone number already exists
      const existingUser = await User.findOne({ phoneNumber });
      if (existingUser) {
        console.log(`Phone number ${phoneNumber} already exists, generating new one...`);
        i--; // Retry this iteration
        continue;
      }

      // Check if referral code already exists
      const existingReferral = await User.findOne({ referralCode });
      if (existingReferral) {
        console.log(`Referral code ${referralCode} already exists, generating new one...`);
        i--; // Retry this iteration
        continue;
      }

      // Create new user with random data
      const user = await User.create({
        phoneNumber,
        username,
        email: `${username.toLowerCase()}@test.com`,
        referralCode,
        depositCash: Math.floor(Math.random() * 1000) + 100, // Random between 100-1100
        winningCash: Math.floor(Math.random() * 500), // Random between 0-500
        bonusCash: 50, // Welcome bonus
        totalGamesPlayed: Math.floor(Math.random() * 50),
        totalGamesWon: Math.floor(Math.random() * 20),
        totalGamesLost: Math.floor(Math.random() * 30),
        totalCoinsWon: Math.floor(Math.random() * 5000),
        isActive: true,
        isBlocked: false,
        deviceInfo: {
          deviceType: 'mobile',
          browser: 'Chrome',
          os: 'Android'
        }
      });

      users.push(user);
      console.log(`\n✅ Test user ${i + 1} created:`);
      console.log('Phone:', user.phoneNumber);
      console.log('Username:', user.username);
      console.log('Email:', user.email);
      console.log('Referral Code:', user.referralCode);
      console.log('Deposit Cash: ₹', user.depositCash);
      console.log('Winning Cash: ₹', user.winningCash);
      console.log('Bonus Cash: ₹', user.bonusCash);
    }

    console.log(`\n🎉 Successfully created ${users.length} test user(s)!\n`);
    console.log('📱 You can login with any of these phone numbers using OTP');
    console.log('💡 In development mode, the OTP will be displayed in the server console\n');

    process.exit(0);
  } catch (error) {
    console.error('Error creating test user:', error);
    process.exit(1);
  }
};

// Get count from command line argument or default to 1
const count = parseInt(process.argv[2]) || 1;

if (count < 1 || count > 100) {
  console.error('Please provide a valid count between 1 and 100');
  process.exit(1);
}

console.log(`Creating ${count} test user(s)...\n`);
createTestUser(count);
