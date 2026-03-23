import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Only initialize Twilio if credentials are provided
let client = null;
if (accountSid && authToken && accountSid.startsWith('AC')) {
  client = twilio(accountSid, authToken);
  console.log('Twilio initialized successfully');
} else {
  console.log('Twilio not configured - OTP will be logged to console in development mode');
}

export const sendOTP = async (phoneNumber, otp) => {
  try {
    // In development without Twilio, just log the OTP
    if (!client || process.env.NODE_ENV === 'development') {
      console.log(`\n📱 OTP for ${phoneNumber}: ${otp}\n`);
      return { success: true, message: 'OTP logged to console' };
    }

    // In production with Twilio configured
    const message = await client.messages.create({
      body: `Your A2Z Ludo verification code is: ${otp}. Valid for 10 minutes.`,
      from: twilioPhoneNumber,
      to: phoneNumber
    });
    return message;
  } catch (error) {
    console.error('Twilio Error:', error);
    // In development, don't throw error, just log
    if (process.env.NODE_ENV === 'development') {
      console.log(`\n📱 OTP for ${phoneNumber}: ${otp} (Twilio failed, using fallback)\n`);
      return { success: true, message: 'OTP logged to console (Twilio unavailable)' };
    }
    throw new Error('Failed to send OTP');
  }
};

export default client;
