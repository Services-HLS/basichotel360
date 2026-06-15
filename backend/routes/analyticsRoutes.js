const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");

// Use express.text() middleware specifically for this route if needed, 
// but it's already handled in app.use(express.json()) and express.urlencoded()
// navigator.sendBeacon sends data as text/plain by default.

router.post("/track", analyticsController.trackActivity);

module.exports = router;
