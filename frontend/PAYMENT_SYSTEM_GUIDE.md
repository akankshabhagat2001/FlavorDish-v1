# FlavourFinder Payment System Guide

## Overview
Complete payment system supporting both **Prepaid** and **Postpaid** options for:
- Online Food Delivery
- Table Booking at Restaurants

---

## Database Models Enhanced

### 1. Order Model (`server/models/Order.js`)
**New Fields:**
```javascript
paymentType: {
  type: String,
  enum: ['prepaid', 'postpaid'],
  default: 'prepaid'
}

paymentMethod: {
  type: String,
  enum: ['cash_on_delivery', 'online', 'upi', 'card', 'wallet'],
  required: true
}
```

### 2. Payment Model (`server/models/Payment.js`)
**New Fields:**
```javascript
paymentType: {
  type: String,
  enum: ['prepaid', 'postpaid'],
  default: 'prepaid'
}

paymentMethod: {
  type: String,
  enum: ['upi', 'card', 'wallet', 'cod', 'net_banking', 'google_pay', 'apple_pay'],
  default: 'upi'
}
```

### 3. TableBooking Model (`server/models/TableBooking.js`)
**New Fields:**
```javascript
paymentType: {
  type: String,
  enum: ['prepaid', 'postpaid'],
  default: 'prepaid'
}

paymentMethod: {
  type: String,
  enum: ['upi', 'card', 'wallet', 'cash']
}

paymentTransactionId: String
refundStatus: String  // 'pending', 'processed', 'failed'
```

---

## Payment Flow

### Prepaid Orders (Online Food Delivery)
```
1. Customer places order
2. Payment gateway shown (Razorpay, PayPal, Stripe)
3. Payment processed before order confirmation
4. Order status: "confirmed"
5. Restaurant prepares food
6. Delivery partner picks up
7. Order delivered
```

### Postpaid Orders (Cash on Delivery)
```
1. Customer places order
2. No immediate payment required
3. Order status: "pending"
4. Restaurant confirms receipt
5. Restaurant prepares food
6. Delivery partner picks up
7. Customer pays cash on delivery
8. Payment recorded in database
```

### Table Booking - Prepaid
```
1. Customer selects date/time/guests
2. System calculates advance amount (e.g., 50% of estimated bill)
3. Customer makes prepaid payment online
4. Booking confirmed with advance payment
5. Customer arrives and completes: check-in
6. Final bill settled at checkout
7. Refund if cancellation within policy window
```

### Table Booking - Postpaid
```
1. Customer selects date/time/guests
2. No advance payment required
3. Booking confirmed (pending confirmation from restaurant)
4. Restaurant confirms availability
5. Customer visits and completes meal
6. Final payment at checkout (cash/card/upi)
7. Can cancel anytime before 24 hours with full refund
```

---

## API Endpoints (To Implement)

### Orders - Payment

**POST /api/orders/create-prepaid**
```json
{
  "restaurantId": "ObjectId",
  "items": [
    {
      "menuItemId": "ObjectId",
      "quantity": 2,
      "price": 500
    }
  ],
  "paymentType": "prepaid",
  "paymentMethod": "upi",
  "deliveryAddress": {
    "street": "123 Main St",
    "city": "Ahmedabad",
    "zipCode": "380001"
  }
}
```
**Response:**
```json
{
  "orderId": "ObjectId",
  "paymentUrl": "razorpay_payment_link",
  "amount": 1500,
  "paymentGateway": "razorpay"
}
```

**POST /api/orders/create-postpaid**
```json
{
  "restaurantId": "ObjectId",
  "items": [...],
  "paymentType": "postpaid",
  "paymentMethod": "cash",
  "deliveryAddress": {...}
}
```
**Response:**
```json
{
  "orderId": "ObjectId",
  "status": "pending",
  "totalAmount": 1500,
  "message": "Order placed. Payment due on delivery"
}
```

**POST /api/orders/verify-payment**
```json
{
  "orderId": "ObjectId",
  "transactionId": "razorpay_txn_123",
  "paymentGatewayResponse": {...}
}
```

**POST /api/orders/:orderId/pay-on-delivery**
```json
{
  "amount": 1500,
  "paymentMethod": "cash|card|upi"
}
```

---

## Table Booking - Payment

**POST /api/bookings/create-prepaid**
```json
{
  "restaurantId": "ObjectId",
  "bookingDate": "2026-04-15",
  "timeSlot": {
    "startTime": "19:00",
    "endTime": "21:00"
  },
  "numberOfGuests": 4,
  "paymentMethod": "upi",
  "customerDetails": {
    "name": "John Doe",
    "phone": "9876543210",
    "email": "john@example.com"
  }
}
```
**Response:**
```json
{
  "bookingId": "ObjectId",
  "confirmationCode": "BK123456",
  "advanceAmount": 1000,
  "totalEstimatedBill": 2000,
  "paymentUrl": "razorpay_payment_link"
}
```

**POST /api/bookings/create-postpaid**
```json
{
  "restaurantId": "ObjectId",
  "bookingDate": "2026-04-15",
  "timeSlot": {...},
  "numberOfGuests": 4,
  "customerDetails": {...}
}
```
**Response:**
```json
{
  "bookingId": "ObjectId",
  "confirmationCode": "BK123456",
  "status": "pending",
  "estimatedBill": 2000,
  "message": "Booking confirmed. Pay at the restaurant"
}
```

**POST /api/bookings/:bookingId/checkout**
```json
{
  "finalBill": 1800,
  "paymentMethod": "card",
  "discount": 200
}
```

---

## Frontend Components Setup

### Order Checkout Component
Update `components/OrderCheckout.tsx`:
```typescript
interface OrderCheckoutProps {
  total: number;
  restaurantId: string;
  items: MenuItem[];
  onSuccess: (order: Order) => void;
}

export const OrderCheckout: React.FC<OrderCheckoutProps> = ({
  total,
  restaurantId,
  items,
  onSuccess
}) => {
  const [paymentType, setPaymentType] = useState<'prepaid' | 'postpaid'>('prepaid');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (paymentType === 'prepaid') {
      // Show payment gateway
      const response = await orderService.createPrepaidOrder({
        restaurantId,
        items,
        paymentMethod
      });
      // Redirect to payment URL
      window.location.href = response.paymentUrl;
    } else {
      // Create COD order
      const order = await orderService.createPostpaidOrder({
        restaurantId,
        items,
        paymentMethod: 'cash'
      });
      onSuccess(order);
    }
  };

  return (
    <div className="payment-container">
      <h2>Payment Method</h2>
      
      <div className="payment-type">
        <label>
          <input 
            type="radio" 
            value="prepaid"
            checked={paymentType === 'prepaid'}
            onChange={(e) => setPaymentType('prepaid')}
          />
          Prepaid (Pay Now)
        </label>
        <label>
          <input 
            type="radio" 
            value="postpaid"
            checked={paymentType === 'postpaid'}
            onChange={(e) => setPaymentType('postpaid')}
          />
          Cash on Delivery
        </label>
      </div>

      {paymentType === 'prepaid' && (
        <div className="payment-methods">
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            <option value="upi">UPI</option>
            <option value="card">Credit/Debit Card</option>
            <option value="wallet">Digital Wallet</option>
            <option value="net_banking">Net Banking</option>
            <option value="google_pay">Google Pay</option>
            <option value="apple_pay">Apple Pay</option>
          </select>
        </div>
      )}

      <div className="bill-summary">
        <p>Total Amount: ₹{total}</p>
      </div>

      <button onClick={handleCheckout} disabled={loading}>
        {paymentType === 'prepaid' ? 'Pay Now' : 'Place Order'}
      </button>
    </div>
  );
};
```

### Table Booking Payment Component
Update `components/TableBookingPayment.tsx`:
```typescript
export const TableBookingPayment: React.FC<TableBookingPaymentProps> = ({
  restaurant,
  booking,
  onSuccess
}) => {
  const [paymentType, setPaymentType] = useState<'prepaid' | 'postpaid'>('prepaid');
  const [advanceAmount] = useState(booking.estimatedBill * 0.5); // 50% advance

  const handlePrepaidBooking = async () => {
    const response = await bookingService.createPrepaidBooking({
      ...booking,
      advanceAmount
    });
    // Show payment gateway
    window.location.href = response.paymentUrl;
  };

  const handlePostpaidBooking = async () => {
    const booking = await bookingService.createPostpaidBooking(booking);
    onSuccess(booking);
  };

  return (
    <div className="booking-payment">
      <h2>Booking Payment</h2>
      
      <div className="estimated-bill">
        <p>Estimated Bill: ₹{booking.estimatedBill}</p>
        {paymentType === 'prepaid' && (
          <p className="advance">Advance (50%): ₹{advanceAmount}</p>
        )}
      </div>

      <div className="payment-options">
        <label>
          <input 
            type="radio" 
            value="prepaid"
            checked={paymentType === 'prepaid'}
            onChange={(e) => setPaymentType('prepaid')}
          />
          Prepaid (Secure your table now with advance payment)
        </label>
        <label>
          <input 
            type="radio" 
            value="postpaid"
            checked={paymentType === 'postpaid'}
            onChange={(e) => setPaymentType('postpaid')}
          />
          Postpaid (Pay at the restaurant)
        </label>
      </div>

      <button onClick={paymentType === 'prepaid' ? handlePrepaidBooking : handlePostpaidBooking}>
        {paymentType === 'prepaid' ? 'Pay Advance' : 'Confirm Booking'}
      </button>
    </div>
  );
};
```

---

## Service Implementation

### orderService.ts
```typescript
export const orderService = {
  createPrepaidOrder: async (data) => {
    return await apiClient.post('/api/orders/create-prepaid', {
      restaurantId: data.restaurantId,
      items: data.items,
      paymentType: 'prepaid',
      paymentMethod: data.paymentMethod,
      deliveryAddress: data.deliveryAddress
    });
  },

  createPostpaidOrder: async (data) => {
    return await apiClient.post('/api/orders/create-postpaid', {
      restaurantId: data.restaurantId,
      items: data.items,
      paymentType: 'postpaid',
      paymentMethod: 'cash',
      deliveryAddress: data.deliveryAddress
    });
  },

  verifyPayment: async (orderId, transactionId) => {
    return await apiClient.post('/api/orders/verify-payment', {
      orderId,
      transactionId
    });
  }
};
```

### bookingService.ts
```typescript
export const bookingService = {
  createPrepaidBooking: async (data) => {
    return await apiClient.post('/api/bookings/create-prepaid', {
      restaurantId: data.restaurantId,
      bookingDate: data.bookingDate,
      timeSlot: data.timeSlot,
      numberOfGuests: data.numberOfGuests,
      paymentMethod: 'upi',
      customerDetails: data.customerDetails
    });
  },

  createPostpaidBooking: async (data) => {
    return await apiClient.post('/api/bookings/create-postpaid', {
      restaurantId: data.restaurantId,
      bookingDate: data.bookingDate,
      timeSlot: data.timeSlot,
      numberOfGuests: data.numberOfGuests,
      customerDetails: data.customerDetails
    });
  }
};
```

---

## Testing Checklist

### Prepaid Orders
- [ ] User selects prepaid option
- [ ] Payment gateway loads correctly
- [ ] Payment succeeds → Order confirmed
- [ ] Payment fails → Error message shown
- [ ] Order status updated to "confirmed"

### Postpaid Orders
- [ ] User selects postpaid option
- [ ] Order created without payment
- [ ] Order shows as "pending"
- [ ] Delivery partner can accept order
- [ ] Customer completes payment on delivery
- [ ] Payment recorded when marked "delivered"

### Prepaid Table Booking
- [ ] Advance amount calculated (50% of estimated bill)
- [ ] Payment gateway displayed
- [ ] Booking confirmed after successful payment
- [ ] Booking shows as "confirmed"
- [ ] Cancellation shows refund calculation

### Postpaid Table Booking
- [ ] Booking created without advance payment
- [ ] Shows as "pending" initially
- [ ] Restaurant can confirm
- [ ] Checkout option appears on check-in
- [ ] Final bill and payment at checkout

---

## Configuration

### Environment Variables
```
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_SECRET_KEY=your_secret_key
STRIPE_PUBLIC_KEY=your_public_key
STRIPE_SECRET_KEY=your_secret_key
PAYPAL_CLIENT_ID=your_client_id
```

### Razorpay Webhook
```javascript
app.post('/api/webhooks/razorpay', (req, res) => {
  // Verify webhook signature
  const signature = req.headers['x-razorpay-signature'];
  const body = req.body;
  
  const isValid = verifyRazorpaySignature(body, signature);
  if (!isValid) {
    return res.status(400).json({ error: 'Invalid signature' });
  }

  // Handle payment events
  if (body.event === 'payment.authorized') {
    // Update order payment status
  }
});
```

---

## Next Steps
1. ✅ Database models updated with paymentType
2. ⏳ Implement API routes for prepaid/postpaid
3. ⏳ Integrate payment gateway (Razorpay/Stripe)
4. ⏳ Create checkout components
5. ⏳ Add payment webhooks
6. ⏳ Test all payment flows
7. ⏳ Deploy to production
