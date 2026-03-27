import axios from 'axios';

const PAYMENT_GATEWAY_URL = 'https://pay0.shop/api';
const USER_TOKEN = process.env.PAYMENT_GATEWAY_TOKEN;

// Validate configuration
if (!USER_TOKEN) {
  console.error('⚠️ PAYMENT_GATEWAY_TOKEN is not set in .env file!');
}

// Create payment order
export const createPaymentOrder = async ({ customerMobile, customerName, amount, orderId, redirectUrl, remark1 = '', remark2 = '' }) => {
  try {
    // Validate token
    if (!USER_TOKEN) {
      throw new Error('Payment gateway token not configured. Please add PAYMENT_GATEWAY_TOKEN to .env file');
    }

    console.log('Creating payment order:', {
      customerMobile,
      customerName,
      amount,
      orderId,
      redirectUrl
    });

    const response = await axios.post(
      `${PAYMENT_GATEWAY_URL}/create-order`,
      new URLSearchParams({
        customer_mobile: customerMobile,
        customer_name: customerName,
        user_token: USER_TOKEN,
        amount: amount.toString(),
        order_id: orderId,
        redirect_url: redirectUrl,
        remark1,
        remark2
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    console.log('Payment gateway response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Payment gateway error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    
    throw new Error(error.message || 'Failed to create payment order');
  }
};

// Check payment status
export const checkPaymentStatus = async (orderId) => {
  try {
    if (!USER_TOKEN) {
      throw new Error('Payment gateway token not configured');
    }

    const response = await axios.post(
      `${PAYMENT_GATEWAY_URL}/check-order-status`,
      new URLSearchParams({
        user_token: USER_TOKEN,
        order_id: orderId
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Payment status check error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to check payment status');
  }
};
