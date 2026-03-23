import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const cleanupNullEmails = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    console.log('Connecting to MongoDB...');
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Count users with null email
    const nullEmailCount = await usersCollection.countDocuments({ email: null });
    console.log(`\n📊 Found ${nullEmailCount} users with null email`);

    if (nullEmailCount > 0) {
      // Remove the email field from documents where it's null
      console.log('\n🔧 Removing null email fields...');
      const result = await usersCollection.updateMany(
        { email: null },
        { $unset: { email: "" } }
      );
      console.log(`✅ Updated ${result.modifiedCount} documents`);
    }

    // Count users with null username
    const nullUsernameCount = await usersCollection.countDocuments({ username: null });
    console.log(`\n📊 Found ${nullUsernameCount} users with null username`);

    if (nullUsernameCount > 0) {
      // Remove the username field from documents where it's null
      console.log('\n🔧 Removing null username fields...');
      const result = await usersCollection.updateMany(
        { username: null },
        { $unset: { username: "" } }
      );
      console.log(`✅ Updated ${result.modifiedCount} documents`);
    }

    // Verify cleanup
    const remainingNullEmails = await usersCollection.countDocuments({ email: null });
    const remainingNullUsernames = await usersCollection.countDocuments({ username: null });
    
    console.log('\n📋 Verification:');
    console.log(`   Remaining null emails: ${remainingNullEmails}`);
    console.log(`   Remaining null usernames: ${remainingNullUsernames}`);

    console.log('\n✅ Cleanup completed successfully!');
    console.log('💡 Users can now register without email/username fields.');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error during cleanup:', error);
    process.exit(1);
  }
};

cleanupNullEmails();
