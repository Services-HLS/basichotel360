

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Import routes
const hotelRoutes = require('./routes/hotelRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const roomRoutes = require('./routes/roomRoutes');
const customerRoutes = require('./routes/customerRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

const expenseRoutes = require('./routes/expenseRoutes');
const salaryRoutes = require('./routes/salaryRoutes');

const reportRoutes = require('./routes/reportRoutes');
const collectionRoutes = require('./routes/collectionRoutes');

const permissionRoutes = require('./routes/permissionRoutes');
const housekeepingRoutes = require('./routes/housekeepingRoutes');
const wallet = require('./routes/walletRoutes');
const quotations = require('./routes/quotationRoutes')


const SchedulerService = require('./services/schedulerService');
const EmailService = require('./services/emailService');
const TrialService = require('./services/TrialService');
const whatsappTestRoutes = require('./routes/whatsappTestRoutes');
const functionRoutes = require('./routes/functionRoomRoutes');
const superAdminRoutes = require('./routes/superAdminRoutes');
const advanceBookingRoutes = require('./routes/advanceBookingRoutes');
const refundRoutes = require('./routes/refundRoutes');

const { setTimezoneMiddleware } = require('./config/database');


const app = express();


app.use(cors({
  origin: true, // This allows all origins
  credentials: true
}));

// CORS configuration - Allow multiple origins
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:8080',
  'http://localhost:8081',
  'http://localhost:5173', // Vite default
  'http://127.0.0.1:3000',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:8081',
  'http://127.0.0.1:5173',
  'http://hotel-management-service.s3-website.ap-south-1.amazonaws.com',
  'https://hms.hithlakshsolutions.com',
  'http://localhost:5174',
  'http://192.168.31.72:8080',
  'http://hotel-management-superadmin.s3-website.ap-south-1.amazonaws.com',
  
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Middleware
// app.use(helmet());
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",      // Allow inline scripts
        "'unsafe-eval'",        // Allow eval (needed for some libraries)
        "https://fonts.googleapis.com",
        "https://cdn.jsdelivr.net",
        "https://code.jquery.com",
        "https://unpkg.com",
      ],
      scriptSrcAttr: ["'unsafe-inline'"],  // CRITICAL: Allow inline event handlers like onclick
      styleSrc: [
        "'self'",
        "'unsafe-inline'",      // Allow inline styles
        "https://fonts.googleapis.com",
      ],
      styleSrcElem: [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com",
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "data:",
      ],
      imgSrc: [
        "'self'",
        "data:",
        "https:",
        "blob:",
      ],
      connectSrc: ["'self'"],
      frameSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
    },
  },
}));
app.use(cors(corsOptions)); // Use the CORS configuration
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.text());
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Handle preflight requests
app.options('*', cors(corsOptions));

EmailService.testConnection().then(isConnected => {
  SchedulerService.startAutoCheckout();

  if (isConnected) {
    console.log('✅ Email service ready');
    SchedulerService.start();
    console.log('✅ Trial management service started');
  } else {
    console.log('⚠️ Email service not configured - skipping email/WhatsApp reminders');
  }
});
console.log('🔄 Trial service initialized');

app.use(setTimezoneMiddleware);

// Routes
app.use('/api/hotels', hotelRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/function-rooms', functionRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/bookings', bookingRoutes);

app.use('/api/permissions', permissionRoutes);

app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/pro-payments', require('./routes/proPaymentRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));
app.use("/api/analytics", require("./routes/analyticsRoutes"));

app.use('/api/reports', reportRoutes);
app.use('/api/collections', collectionRoutes);


app.use('/api/expenses', expenseRoutes);
app.use('/api/salaries', salaryRoutes);
app.use('/api/housekeeping', housekeepingRoutes);
app.use('/api/wallet', wallet);
app.use('/api/quotations', quotations)
app.use('/api/whatsapp', whatsappTestRoutes);
app.use('/api/superadmin', superAdminRoutes);
app.use('/api/advance-bookings', advanceBookingRoutes);
app.use('/api/refunds', refundRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Hotel Management API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      email: EmailService.transporter ? 'Connected' : 'Not configured',
      scheduler: SchedulerService.start ? 'Configured' : 'Not configured', // ✅ Check if method exists
      trial: 'Active'
    },
    cors: {
      allowedOrigins: allowedOrigins,
      currentOrigin: req.headers.origin || 'No origin header'
    }
  });
});



// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: `Route ${req.originalUrl} not found`
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      error: 'CORS_ERROR',
      message: `Origin ${req.headers.origin} not allowed`
    });
  }

  console.error('💥 Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'SERVER_ERROR',
    message: 'Internal server error'
  });
});

module.exports = app;

