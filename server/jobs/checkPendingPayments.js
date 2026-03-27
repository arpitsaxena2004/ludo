import DepositRequest from '../models/DepositRequest.js';
import User from '../models/User.js';
import { checkPaymentStatus } from '../services/paymentGateway.js';

// Check and update pending payment statuses
export const checkPendingPayments = async () => {
  try {
    console.log('🔍 Checking pending payments...');

    // Find all processing deposits older than 6 minutes
    const sixMinutesAgo = new Date(Date.now() - 6 * 60 * 1000);
    
    const processingDeposits = await DepositRequest.find({
      status: 'processing',
      paymentMethod: 'gateway',
      createdAt: { $lt: sixMinutesAgo }
    });

    console.log(`Found ${processingDeposits.length} pending deposits to check`);

    for (const deposit of processingDeposits) {
      try {
        // Check status from payment gateway
        const statusResponse = await checkPaymentStatus(deposit.orderId);

        if (statusResponse.status && statusResponse.result) {
          const { txnStatus, utr } = statusResponse.result;

          if (txnStatus === 'SUCCESS') {
            // Payment successful - approve it
            deposit.status = 'approved';
            deposit.utr = utr || '';
            deposit.processedAt = new Date();
            await deposit.save();

            // Add amount to user's deposit cash
            const user = await User.findById(deposit.user);
            if (user) {
              user.depositCash += deposit.amount;
              await user.save();
              console.log(`✅ Deposit ${deposit.orderId} approved - ₹${deposit.amount} credited to user ${user.phoneNumber}`);
            }
          } else if (txnStatus === 'FAILED' || txnStatus === 'CANCELLED') {
            // Payment failed - mark as rejected
            deposit.status = 'rejected';
            deposit.adminNotes = 'Payment failed or cancelled';
            deposit.processedAt = new Date();
            await deposit.save();
            console.log(`❌ Deposit ${deposit.orderId} rejected - Payment ${txnStatus}`);
          } else if (txnStatus === 'PENDING') {
            // Still pending after 6 minutes - mark as failed
            deposit.status = 'rejected';
            deposit.adminNotes = 'Payment timeout - No response from gateway after 6 minutes';
            deposit.processedAt = new Date();
            await deposit.save();
            console.log(`⏱️ Deposit ${deposit.orderId} rejected - Timeout`);
          }
        } else {
          // Gateway error or no response - mark as failed
          deposit.status = 'rejected';
          deposit.adminNotes = 'Payment gateway error - No response received';
          deposit.processedAt = new Date();
          await deposit.save();
          console.log(`⚠️ Deposit ${deposit.orderId} rejected - Gateway error`);
        }
      } catch (error) {
        console.error(`Error checking deposit ${deposit.orderId}:`, error.message);
        
        // If error checking status, mark as failed after 6 minutes
        deposit.status = 'rejected';
        deposit.adminNotes = 'Payment verification failed - Please contact support';
        deposit.processedAt = new Date();
        await deposit.save();
      }
    }

    console.log('✅ Pending payments check completed');
  } catch (error) {
    console.error('Error in checkPendingPayments job:', error);
  }
};

// Run every 2 minutes
export const startPaymentCheckJob = () => {
  console.log('🚀 Starting payment check job (runs every 2 minutes)');
  
  // Run immediately on start
  checkPendingPayments();
  
  // Then run every 2 minutes
  setInterval(checkPendingPayments, 2 * 60 * 1000);
};
