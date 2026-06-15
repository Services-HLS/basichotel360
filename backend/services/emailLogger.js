const fs = require('fs');
const path = require('path');

class EmailLogger {
  constructor() {
    this.logDir = path.join(__dirname, '../logs/emails');
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  async logEmail(type, bookingId, hotelId, customerEmail, status) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type,
      bookingId,
      hotelId,
      customerEmail,
      status,
      sent: status === 'sent'
    };

    const logFile = path.join(this.logDir, `emails-${new Date().toISOString().split('T')[0]}.json`);
    
    try {
      let logs = [];
      if (fs.existsSync(logFile)) {
        logs = JSON.parse(fs.readFileSync(logFile, 'utf8'));
      }
      logs.push(logEntry);
      fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
    } catch (error) {
      console.error('❌ Error logging email:', error);
    }
  }

  async hasEmailBeenSent(type, bookingId) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const logFile = path.join(this.logDir, `emails-${today}.json`);
      
      if (fs.existsSync(logFile)) {
        const logs = JSON.parse(fs.readFileSync(logFile, 'utf8'));
        return logs.some(log => 
          log.type === type && 
          log.bookingId === bookingId && 
          log.status === 'sent'
        );
      }
      return false;
    } catch (error) {
      return false;
    }
  }
}

module.exports = new EmailLogger();