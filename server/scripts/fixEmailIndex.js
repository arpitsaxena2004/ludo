import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const fixEmailIndex = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    console.log('Connecting to MongoDB...');
    console.log('URI:', mongoUri ? mongoUri.substring(0, 20) + '...' : 'Not found');
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Get all indexes
    console.log('\n📋 Fetching current indexes...');
    const indexes = await usersCollection.indexes();
    console.log('Current indexes:', JSON.stringify(indexes, null, 2));

    // Drop the old email index if it exists and is not sparse
    const emailIndex = indexes.find(idx => idx.key && idx.key.email === 1);
    if (emailIndex) {
      if (!emailIndex.sparse) {
        console.log('\n🔧 Dropping non-sparse email index...');
        try {
          await usersCollection.dropIndex('email_1');
          console.log('✅ Old email index dropped');
        } catch (err) {
          console.log('⚠️  Could not drop email index:', err.message);
        }
      } else {
        console.log('\n✅ Email index is already sparse');
      }
    } else {
      console.log('\n⚠️  No email index found');
    }

    // Drop the old username index if it exists and is not sparse
    const usernameIndex = indexes.find(idx => idx.key && idx.key.username === 1);
    if (usernameIndex) {
      if (!usernameIndex.sparse) {
        console.log('\n🔧 Dropping non-sparse username index...');
        try {
          await usersCollection.dropIndex('username_1');
          console.log('✅ Old username index dropped');
        } catch (err) {
          console.log('⚠️  Could not drop username index:', err.message);
        }
      } else {
        console.log('\n✅ Username index is already sparse');
      }
    } else {
      console.log('\n⚠️  No username index found');
    }

    // Create sparse unique indexes
    console.log('\n🔧 Creating sparse unique indexes...');
    try {
      await usersCollection.createIndex({ email: 1 }, { unique: true, sparse: true });
      console.log('✅ Email sparse index created');
    } catch (err) {
      console.log('⚠️  Email index might already exist:', err.message);
    }

    try {
      await usersCollection.createIndex({ username: 1 }, { unique: true, sparse: true });
      console.log('✅ Username sparse index created');
    } catch (err) {
      console.log('⚠️  Username index might already exist:', err.message);
    }

    // Verify indexes
    console.log('\n📋 Verifying new indexes...');
    const newIndexes = await usersCollection.indexes();
    console.log('New indexes:', JSON.stringify(newIndexes, null, 2));

    console.log('\n✅ Email and username indexes fixed successfully!');
    console.log('\n💡 You can now register users without email addresses.');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error fixing indexes:', error);
    process.exit(1);
  }
};

fixEmailIndex();
