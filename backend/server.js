// const app = require('./app');
// const { testConnection } = require('./config/database');

// const PORT = process.env.PORT || 3001;

// // Test database connection and start server
// testConnection().then(() => {
//   app.listen(PORT, () => {
//     console.log(`🚀 Server running on port ${PORT}`);
//     console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
//     console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
//   });
// }).catch(error => {
//   console.error('Failed to start server:', error);
//   process.exit(1);
// });

const app = require('./app');
const { testConnection } = require('./config/database');
const NotificationDevice = require('./models/NotificationDevice');
const OtaReservation = require('./models/OtaReservation');
const Hotel = require('./models/Hotel');

const PORT = process.env.PORT || 3001;

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await testConnection();
    await NotificationDevice.ensureTable();
    console.log('✅ Notification devices table ready');
    await OtaReservation.ensureTable();
    console.log('✅ OTA reservations table ready');
    await Hotel.ensureHotelCodeColumn();
    console.log('✅ Hotels hotelcode column ready');
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`\n🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
      console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
      console.log(`💾 Database: ${process.env.DB_NAME || 'hotel_management'}`);
    });
  } catch (error) {
    console.error('💥 Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Server shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Server shutting down gracefully...');
  process.exit(0);
});

// Start the application
startServer();