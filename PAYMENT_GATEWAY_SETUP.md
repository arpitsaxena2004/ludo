# Payment Gateway Integration - Pay0.shop

## Overview
Automatic payment gateway integration using Pay0.shop for instant deposits. No manual approval needed.

## Setup Instructions

### 1. Add API Keys to .env
Edit `server/.env` and add your Pay0.shop credentials:

```env
PAYMENT_GATEWAY_TOKEN=your_api_key_here
PAYMENT_GATEWAY_SECRET=your_secret_key_here
CLIENT_URL=http://localhost:5173
```

### 2. Configure Webhook URL
In your Pay0.shop dashboard, set the webhook URL to:
```
https://yourdomain.com/api/payment/webhook
```

For local testing with ngrok:
```
https://your-ngrok-url.ngrok.io/api/payment/webhook
```

### 3. Restart Server
```bash
cd server
npm install
npm start
```

## How It Works

### User Flow:
1. User enters amount on deposit page
2. System creates order with payment gateway
3. User redirected to payment gateway
4. User completes payment (UPI/Card/Net Banking)
5. Payment gateway sends webhook to our server
6. Money automatically credited to user wallet
7. User redirected to success page

### Admin Flow:
- Admin can only VIEW transactions
- No manual approval needed
- All deposits are automatic

## New Files Created

### Server Side:
- `server/services/paymentGateway.js` - Payment gateway API integration
- Updated `server/models/DepositRequest.js` - Added gateway fields
- Updated `server/controllers/paymentController.js` - New deposit logic
- Updated `server/routes/paymentRoutes.js` - New routes

### Client Side:
- `client/src/pages/Deposit.jsx` - New simplified deposit page
- `client/src/pages/PaymentSuccess.jsx` - Payment verification page
- Updated `client/src/App.jsx` - Added new route

## API Endpoints

### User Endpoints:
- `POST /api/payment/deposit` - Create payment order
- `GET /api/payment/deposit/status/:orderId` - Check payment status
- `GET /api/payment/deposit/history` - Get deposit history

### Webhook:
- `POST /api/payment/webhook` - Payment gateway callback (public)

### Admin Endpoints:
- `GET /api/payment/admin/deposits` - View all deposits (read-only)

## Testing

### Local Testing with ngrok:
1. Install ngrok: https://ngrok.com/download
2. Run ngrok: `ngrok http 5000`
3. Copy the HTTPS URL
4. Set webhook URL in Pay0.shop dashboard
5. Test deposit flow

### Test Payment:
1. Go to deposit page
2. Enter amount (e.g., ₹100)
3. Click "Proceed to Payment"
4. Complete payment on gateway
5. Check if money credited automatically

## Database Changes

### DepositRequest Model:
- Added `paymentMethod: 'gateway'`
- Added `orderId` - Unique order ID
- Added `gatewayOrderId` - Gateway's order ID
- Added `paymentUrl` - Payment gateway URL
- Added `utr` - Transaction reference
- Added `status: 'processing'` - New status

## Security Notes

1. Webhook endpoint is public (no auth required)
2. Validate webhook data before processing
3. Check order exists before crediting
4. Prevent duplicate credits using orderId
5. Store UTR for dispute resolution

## Troubleshooting

### Payment not credited:
1. Check webhook logs in server console
2. Verify webhook URL in Pay0.shop dashboard
3. Check deposit status: `GET /api/payment/deposit/status/:orderId`
4. Check server logs for errors

### Webhook not received:
1. Verify ngrok is running (for local testing)
2. Check webhook URL is correct
3. Test webhook manually using Postman
4. Check firewall settings

## Support

For Pay0.shop API issues:
- Documentation: https://pay0.shop/docs
- Support: Contact Pay0.shop support team

For integration issues:
- Check server logs
- Check browser console
- Verify API keys are correct
