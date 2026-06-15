const axios = require("axios");

const trackActivity = async (req, res) => {
  try {
    // navigator.sendBeacon sends data as a string
    const data = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    // Get capture IP Address from request
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    // Prepare payload for Google Sheets
    const payload = {
      timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      userId: data.userId || "Guest",
      deviceId: data.guestUuid || "Registered User", // Use guest_uuid as unique device identifier
      email: data.email || "N/A",
      ipAddress: ip === '::1' ? '127.0.0.1' : ip,
      pagePath: data.pagePath,
      duration: data.duration + "s",
      deviceInfo: data.userAgent,
      sessionId: data.sessionId
    };

    const googleSheetUrl = process.env.GOOGLE_SHEET_TRACKING_URL;

    if (googleSheetUrl && googleSheetUrl !== "your_google_script_web_app_url_here") {
      console.log(`📤 Sending activity to Google Sheets: ${payload.pagePath} (${payload.duration})`);
      // Send to Google Sheets
      axios.post(googleSheetUrl, payload).catch((err) => {
        console.error("Google Sheets Tracking Error:", err.message);
      });
    } else {
      console.warn("⚠️ Google Sheet URL not configured in .env");
    }

    res.status(204).end(); // No Content response is best for beacons
  } catch (error) {
    console.error("Analytics Error:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

module.exports = {
  trackActivity,
};
