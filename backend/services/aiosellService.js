const axios = require('axios');
const Hotel = require('../models/Hotel');
const Room = require('../models/Room');

const SANDBOX_BASE_URL = 'https://live.aiosell.com/api/v2/cm';
const SANDBOX_USERNAME = 'aiosell';
const SANDBOX_PASSWORD = 'AIOsell@123';
const SANDBOX_ENDPOINT_KEY = 'sample-pms';

const DEFAULT_RATES = {
  '2bhk-apartment-p-ep': 4000,
  '2bhk-apartment-h-ep': 4500,
};

function slugifyRoomCode(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

function getConnectionConfig() {
  return {
    baseUrl: SANDBOX_BASE_URL,
    username: SANDBOX_USERNAME,
    password: SANDBOX_PASSWORD,
    endpointKey: SANDBOX_ENDPOINT_KEY,
  };
}

function getRatePlansForRoom(ratePlanIds, roomCode) {
  const matchingPlans = ratePlanIds.filter(
    (planId) => planId.startsWith(`${roomCode}-`) || planId.includes(roomCode)
  );

  return matchingPlans.length > 0 ? matchingPlans : ratePlanIds.slice(0, 6);
}

function getTodayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

async function getHotelChannelData(internalHotelId) {
  const hotel = await Hotel.findById(internalHotelId);
  if (!hotel) {
    throw new Error('Hotel not found');
  }

  const rooms = await Room.findByHotel(internalHotelId);
  const roomIds = [
    ...new Set(
      rooms
        .map((room) => slugifyRoomCode(room.type) || slugifyRoomCode(room.room_number))
        .filter(Boolean)
    ),
  ];

  const ratePlanIds = roomIds.flatMap((roomCode) => [
    `${roomCode}-s-ep`,
    `${roomCode}-d-ep`,
    `${roomCode}-t-ep`,
    `${roomCode}-q-ep`,
    `${roomCode}-p-ep`,
    `${roomCode}-h-ep`,
  ]);

  return {
    hotel,
    hotelCode: hotel.hotelcode || '',
    roomIds,
    ratePlanIds,
  };
}

function buildInventoryTemplate({ inventoryHotelCode, roomIds }) {
  const today = getTodayIsoDate();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowIso = tomorrow.toISOString().slice(0, 10);
  const roomCode = roomIds[0] || '';

  return {
    hotelCode: inventoryHotelCode,
    updates: [
      {
        startDate: today,
        endDate: today,
        rooms: [
          {
            available: 18,
            roomCode,
          },
        ],
      },
      {
        startDate: tomorrowIso,
        endDate: tomorrowIso,
        rooms: [
          {
            available: 19,
            roomCode,
          },
        ],
      },
    ],
  };
}

function buildRatesTemplate({ ratesHotelCode, roomIds, ratePlanIds }) {
  const today = getTodayIsoDate();
  const roomCode = roomIds[0] || '';
  const plans = getRatePlansForRoom(ratePlanIds, roomCode);

  return {
    hotelCode: ratesHotelCode,
    updates: [
      {
        startDate: today,
        endDate: today,
        rates: plans.map((rateplanCode) => ({
          roomCode,
          rateplanCode,
          rate: DEFAULT_RATES[rateplanCode] || 3500,
        })),
      },
    ],
  };
}

function getWebhookConfig() {
  const config = getConnectionConfig();

  return {
    username: config.username,
    password: config.password,
    endpointKey: config.endpointKey,
  };
}

function buildPublicConfig(channelConfig, publicBaseUrl = '') {
  const connection = getConnectionConfig();
  const pmsBaseUrl = publicBaseUrl || 'https://<your-public-api-domain>';

  return {
    baseUrl: connection.baseUrl,
    endpointKey: connection.endpointKey,
    hotelId: channelConfig.hotelCode,
    inventoryHotelCode: channelConfig.hotelCode,
    ratesHotelCode: channelConfig.hotelCode,
    hotelCode: channelConfig.hotelCode,
    hotelCodeConfigured: Boolean(channelConfig.hotelCode),
    roomIds: channelConfig.roomIds,
    ratePlanIds: channelConfig.ratePlanIds,
    inventoryUrl: `${connection.baseUrl}/update/${connection.endpointKey}`,
    ratesUrl: `${connection.baseUrl}/update-rates/${connection.endpointKey}`,
    reservationsUrl: `${pmsBaseUrl}/api/v2/cm/reservations/${connection.endpointKey}`,
    inventoryTemplate: buildInventoryTemplate({
      inventoryHotelCode: channelConfig.hotelCode,
      roomIds: channelConfig.roomIds,
    }),
    ratesTemplate: buildRatesTemplate({
      ratesHotelCode: channelConfig.hotelCode,
      roomIds: channelConfig.roomIds,
      ratePlanIds: channelConfig.ratePlanIds,
    }),
  };
}

async function getPublicConfigForHotel(internalHotelId, publicBaseUrl = '') {
  const channelData = await getHotelChannelData(internalHotelId);

  return {
    ...buildPublicConfig(channelData, publicBaseUrl),
    internalHotelId,
    hotelName: channelData.hotel.name,
  };
}

async function postToAiosell(url, payload) {
  const config = getConnectionConfig();
  const response = await axios.post(url, payload, {
    auth: {
      username: config.username,
      password: config.password,
    },
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    timeout: 30000,
    validateStatus: () => true,
  });

  return {
    status: response.status,
    data: response.data,
  };
}

async function pushInventory(payload) {
  const config = getConnectionConfig();
  const url = `${config.baseUrl}/update/${config.endpointKey}`;
  const result = await postToAiosell(url, payload);

  return {
    ...result,
    request: {
      url,
      payload,
    },
  };
}

async function pushRates(payload) {
  const config = getConnectionConfig();
  const url = `${config.baseUrl}/update-rates/${config.endpointKey}`;
  const result = await postToAiosell(url, payload);

  return {
    ...result,
    request: {
      url,
      payload,
    },
  };
}

module.exports = {
  getConnectionConfig,
  getWebhookConfig,
  getPublicConfigForHotel,
  pushInventory,
  pushRates,
};
