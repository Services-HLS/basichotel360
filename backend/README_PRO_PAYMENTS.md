# PRO Plan Payment Integration

This document describes the PRO plan payment system using Razorpay.

## Files Created

### 1. **queries/proPaymentQueries.js**
   - Contains all SQL queries for the `pro_payments` table
   - Includes queries for creating, reading, updating, and searching payments

### 2. **models/ProPayment.js**
   - Model class for PRO plan payments
   - Methods for CRUD operations on payment records
   - Links payments to hotels after registration

### 3. **controllers/proPaymentController.js**
   - Handles Razorpay order creation
   - Verifies payment signatures securely
   - Manages payment records in database
   - Provides endpoints for payment management

### 4. **routes/proPaymentRoutes.js**
   - Defines API routes for PRO plan payments
   - Public routes: `/create-order`, `/verify` (no authentication)
   - Protected routes: `/stats`, `/search`, etc. (require authentication)

### 5. **migrations/create_pro_payments_table.sql**
   - SQL script to create the `pro_payments` table
   - Includes indexes for performance
   - Foreign key relationship with `hotels` table

## Database Setup

### Step 1: Run the Migration
```sql
-- Execute the SQL file in your MySQL database
SOURCE migrations/create_pro_payments_table.sql;
```

Or manually run the SQL commands from `migrations/create_pro_payments_table.sql`

### Step 2: Verify Table Creation
```sql
DESCRIBE pro_payments;
SHOW INDEXES FROM pro_payments;
```

## API Endpoints

### Public Endpoints (No Authentication)

#### 1. Create Razorpay Order
```
POST /api/pro-payments/create-order
```
**Request Body:**
```json
{
  "amount": 39900,
  "currency": "INR",
  "receipt": "pro_plan_1234567890",
  "hotelName": "Example Hotel",
  "adminName": "John Doe",
  "adminEmail": "admin@example.com",
  "adminPhone": "9876543210",
  "notes": {
    "plan": "pro"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "id": "order_xxxxx",
    "amount": 39900,
    "currency": "INR",
    "receipt": "pro_plan_1234567890",
    "status": "created",
    "created_at": 1234567890,
    "payment_record_id": 1
  }
}
```

#### 2. Verify Payment
```
POST /api/pro-payments/verify
```
**Request Body:**
```json
{
  "razorpay_order_id": "order_xxxxx",
  "razorpay_payment_id": "pay_xxxxx",
  "razorpay_signature": "signature_xxxxx",
  "plan": "pro",
  "hotelName": "Example Hotel",
  "email": "admin@example.com",
  "adminName": "John Doe",
  "adminPhone": "9876543210"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment verified successfully",
  "data": {
    "payment_id": "pay_xxxxx",
    "order_id": "order_xxxxx",
    "status": "success",
    "amount": 39900,
    "currency": "INR",
    "verified_at": "2024-01-01T12:00:00.000Z",
    "plan": "pro",
    "hotelName": "Example Hotel",
    "email": "admin@example.com",
    "payment_record_id": 1
  }
}
```

### Protected Endpoints (Require Authentication)

#### 3. Get Payment by ID
```
GET /api/pro-payments/:id
Headers: Authorization: Bearer <token>
```

#### 4. Get Payments by Hotel
```
GET /api/pro-payments/hotel/:hotelId
Headers: Authorization: Bearer <token>
```

#### 5. Get Payments by Email
```
GET /api/pro-payments/email/:email
Headers: Authorization: Bearer <token>
```

#### 6. Get Payment Statistics
```
GET /api/pro-payments/stats/summary
Headers: Authorization: Bearer <token>
```

#### 7. Search Payments
```
GET /api/pro-payments/search/query?q=search_term&limit=50&offset=0
Headers: Authorization: Bearer <token>
```

## Database Schema

### Table: `pro_payments`

| Column | Type | Description |
|--------|------|-------------|
| id | INT(11) | Primary key, auto increment |
| hotel_id | INT(11) | Foreign key to hotels table (nullable) |
| hotel_name | VARCHAR(255) | Hotel name at time of payment |
| admin_name | VARCHAR(255) | Admin name at time of payment |
| admin_email | VARCHAR(255) | Admin email at time of payment |
| admin_phone | VARCHAR(20) | Admin phone at time of payment |
| razorpay_order_id | VARCHAR(255) | Razorpay order ID (unique) |
| razorpay_payment_id | VARCHAR(255) | Razorpay payment ID (unique) |
| razorpay_signature | VARCHAR(255) | Razorpay payment signature |
| amount | DECIMAL(10,2) | Amount in paise |
| currency | VARCHAR(10) | Currency code (default: INR) |
| plan_type | VARCHAR(50) | Plan type (default: pro) |
| payment_status | VARCHAR(50) | pending, success, failed, refunded |
| payment_method | VARCHAR(50) | card, upi, netbanking, wallet, etc. |
| gateway_response | JSON | Full Razorpay API response |
| metadata | JSON | Additional payment metadata |
| created_at | TIMESTAMP | Record creation timestamp |
| updated_at | TIMESTAMP | Record update timestamp |

## Payment Flow

1. **User selects PRO plan** → Frontend calls `/pro-payments/create-order`
2. **Order created** → Payment record saved with status `pending`
3. **Razorpay modal opens** → User completes payment
4. **Payment success** → Frontend calls `/pro-payments/verify`
5. **Payment verified** → Payment record updated with status `success`
6. **Hotel registration** → Payment linked to hotel via `hotel_id`

## Environment Variables

Add these to your `.env` file:

```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret_key_here
```

## Security Features

1. **Signature Verification**: HMAC SHA256 signature verification
2. **Payment Status Check**: Verifies payment is captured/authorized
3. **Order ID Matching**: Ensures payment matches order
4. **Database Records**: All payments are logged in database
5. **Hotel Linking**: Payments are linked to hotels after registration

## Testing

### Test Mode
- Use Razorpay test keys (`rzp_test_...`)
- Test payment ID: Use Razorpay test cards
- All payments are recorded in database

### Production Mode
- Use Razorpay live keys (`rzp_live_...`)
- Real payments are processed
- All payments are verified and recorded

## Integration with Hotel Registration

When a hotel registers with PRO plan:
1. Payment details are included in registration request
2. Hotel is created in database
3. Payment record is linked to hotel via `hotel_id`
4. Payment status can be checked later

## Error Handling

- Invalid signature → Returns 400 error
- Payment not captured → Returns 400 error
- Order mismatch → Returns 400 error
- Database errors → Returns 500 error with error message

## Notes

- Payment records are created before hotel registration
- `hotel_id` is null initially, updated after registration
- All payment data is stored in JSON format for flexibility
- Payment verification is done server-side for security
