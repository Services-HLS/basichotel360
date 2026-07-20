const fs = require('fs');
const path = require('path');
const { initializeApp, getApps, cert } = require('firebase-admin');
const { getMessaging } = require('firebase-admin/messaging');
const NotificationDevice = require('../models/NotificationDevice');

let messaging = null;
let initialized = false;
let initError = null;
let lastCredentialMeta = null;

function normalizePrivateKey(key) {
  if (!key || typeof key !== 'string') return key;

  let normalized = key.trim();

  // Elastic Beanstalk / shell escaping can double-escape newlines.
  while (normalized.includes('\\n')) {
    normalized = normalized.replace(/\\n/g, '\n');
  }

  // If pasted without escapes, PEM may be one long line — restore line breaks.
  if (normalized.includes('-----BEGIN PRIVATE KEY-----')) {
    const body = normalized
      .replace('-----BEGIN PRIVATE KEY-----', '')
      .replace('-----END PRIVATE KEY-----', '')
      .replace(/\s+/g, '');
    if (body && !normalized.includes('\n')) {
      normalized = `-----BEGIN PRIVATE KEY-----\n${body}\n-----END PRIVATE KEY-----\n`;
    }
  }

  return normalized;
}

function normalizeServiceAccount(raw) {
  const account = { ...raw };
  if (account.private_key) {
    account.private_key = normalizePrivateKey(account.private_key);
  }
  return account;
}

function parseJsonEnv(rawValue, envName) {
  let value = rawValue.trim();
  if (
    (value.startsWith("'") && value.endsWith("'")) ||
    (value.startsWith('"') && value.endsWith('"'))
  ) {
    value = value.slice(1, -1);
  }
  try {
    return JSON.parse(value);
  } catch (err) {
    throw new Error(`${envName} is not valid JSON`);
  }
}

function loadServiceAccount() {
  const b64Env = process.env.FIREBASE_SERVICE_ACCOUNT_JSON_B64;
  if (b64Env) {
    try {
      const json = Buffer.from(b64Env.trim(), 'base64').toString('utf8');
      lastCredentialMeta = { source: 'FIREBASE_SERVICE_ACCOUNT_JSON_B64' };
      return normalizeServiceAccount(JSON.parse(json));
    } catch (err) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON_B64 is not valid base64 JSON');
    }
  }

  const jsonEnv = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (jsonEnv) {
    lastCredentialMeta = { source: 'FIREBASE_SERVICE_ACCOUNT_JSON' };
    return normalizeServiceAccount(parseJsonEnv(jsonEnv, 'FIREBASE_SERVICE_ACCOUNT_JSON'));
  }

  const filePath =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
    path.join(__dirname, '..', 'firebase-service-account.json');

  if (!fs.existsSync(filePath)) {
    lastCredentialMeta = { source: 'none' };
    return null;
  }

  lastCredentialMeta = { source: 'file', path: filePath };
  return normalizeServiceAccount(JSON.parse(fs.readFileSync(filePath, 'utf8')));
}

function initFirebaseAdmin() {
  if (initialized) return messaging;
  initialized = true;

  try {
    const serviceAccount = loadServiceAccount();
    if (!serviceAccount) {
      initError = 'Firebase service account not configured';
      return null;
    }

    if (!serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) {
      initError = 'Firebase service account JSON is missing required fields';
      return null;
    }

    lastCredentialMeta = {
      ...(lastCredentialMeta || {}),
      privateKeyLength: serviceAccount.private_key.length,
    };

    if (!getApps().length) {
      initializeApp({
        credential: cert(serviceAccount),
      });
    }
    messaging = getMessaging();
    console.log('✅ Firebase Admin initialized for push notifications');
    return messaging;
  } catch (err) {
    const keyLen = lastCredentialMeta?.privateKeyLength;
    initError =
      err.message.includes('private key') && keyLen
        ? `${err.message} (private_key length: ${keyLen}, expected ~1700+)`
        : err.message;
    console.warn('⚠️ Firebase Admin not available:', err.message);
    return null;
  }
}

function isConfigured() {
  return !!initFirebaseAdmin();
}

function getStatus() {
  const status = {
    configured: isConfigured(),
    error: initError,
  };
  if (lastCredentialMeta) {
    status.credentialSource = lastCredentialMeta.source;
    if (lastCredentialMeta.privateKeyLength) {
      status.privateKeyLength = lastCredentialMeta.privateKeyLength;
    }
  }
  return status;
}

async function sendToTokens(tokens, payload) {
  const svc = initFirebaseAdmin();
  if (!svc) {
    return {
      success: false,
      error: initError || 'Firebase not configured',
      successCount: 0,
      failureCount: tokens.length,
    };
  }

  const uniqueTokens = [...new Set(tokens.filter(Boolean))];
  if (uniqueTokens.length === 0) {
    return { success: true, successCount: 0, failureCount: 0, results: [] };
  }

  const data = {
    module: String(payload.module || 'account'),
    title: String(payload.title || 'Hotel360'),
    message: String(payload.message || ''),
    priority: String(payload.priority || 'normal'),
  };

  if (payload.entityId) data.entityId = String(payload.entityId);
  if (payload.route) data.route = String(payload.route);
  if (payload.id) data.id = String(payload.id);

  const message = {
    tokens: uniqueTokens,
    notification: {
      title: data.title,
      body: data.message,
    },
    data,
    android: {
      priority: 'high',
      notification: {
        sound: 'default',
        channelId: 'hotel360_default',
      },
    },
  };

  const response = await svc.sendEachForMulticast(message);

  const invalidTokens = [];
  response.responses.forEach((item, index) => {
    if (!item.success) {
      const code = item.error?.code;
      if (
        code === 'messaging/registration-token-not-registered' ||
        code === 'messaging/invalid-registration-token'
      ) {
        invalidTokens.push(uniqueTokens[index]);
      }
    }
  });

  return {
    success: response.failureCount === 0,
    successCount: response.successCount,
    failureCount: response.failureCount,
    invalidTokens,
  };
}

async function sendPushToHotel(hotelId, payload) {
  const devices = await NotificationDevice.getActiveTokensForHotel(hotelId);
  const tokens = devices.map((d) => d.fcm_token);
  return sendToTokens(tokens, payload);
}

module.exports = {
  isConfigured,
  getStatus,
  sendToTokens,
  sendPushToHotel,
};
