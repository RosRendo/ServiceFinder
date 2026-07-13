import http from 'k6/http';
import { check, sleep } from 'k6';

// ─── STAGE CONFIGURATION ───────────────────────────────────────────────────
// Simulate 1,000 concurrent users peak load with ramping up and down.
export const options = {
  stages: [
    { duration: '1m', target: 200 },  // Ramp-up to 200 virtual users (VUs)
    { duration: '3m', target: 500 },  // Ramp-up to 500 VUs
    { duration: '5m', target: 1000 }, // Peak load: 1,000 concurrent users for 5 mins
    { duration: '2m', target: 200 },  // Ramp-down to 200 VUs
    { duration: '1m', target: 0 },    // Cool down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete under 500ms
    http_req_failed: ['rate<0.01'],   // Error rate must be less than 1%
  },
};

// Base URL points to the local NestJS backend server running on port 5000
const BASE_URL = __ENV.API_URL || 'http://localhost:5000';

export default function () {
  // ─── STEP 1: Registration / Login ─────────────────────────────────────────
  const email = `load_user_${__VU}_${Math.floor(Math.random() * 100000)}@example.com`;
  const registerPayload = JSON.stringify({
    fullName: `Load VU ${__VU}`,
    email: email,
    password: 'Password123!',
    role: 'customer',
  });

  const headers = { 'Content-Type': 'application/json' };

  // Register
  const registerRes = http.post(`${BASE_URL}/auth/register`, registerPayload, { headers });
  const registerCheck = check(registerRes, {
    'registered successfully': (r) => r.status === 201,
  });

  sleep(1);

  if (!registerCheck) {
    // If registration fails, fallback to login
    const loginPayload = JSON.stringify({
      email: 'customer1@example.com',
      password: 'Password123!',
    });
    const loginRes = http.post(`${BASE_URL}/auth/login`, loginPayload, { headers });
    check(loginRes, {
      'login successfully': (r) => r.status === 200,
    });
  }

  // Retrieve access token from response (if login/register returned one)
  let token = '';
  try {
    const resBody = JSON.parse(registerRes.body);
    token = resBody.token;
  } catch (e) {
    // Fallback if needed
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  sleep(Math.random() * 2 + 1); // Realistic wait time between 1 and 3 seconds

  // ─── STEP 2: Service / Company Search & Explore ─────────────────────────────
  // Simulates users querying the search engine (Elasticsearch fuzzy / database fallback)
  const searchQueries = ['Cleaning', 'Haircut', 'Massage', 'Mechanic', 'Plumber'];
  const randomQuery = searchQueries[Math.floor(Math.random() * searchQueries.length)];

  const searchRes = http.get(`${BASE_URL}/services?search=${randomQuery}`);
  check(searchRes, {
    'search status is 200': (r) => r.status === 200,
    'search returns list': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.services) || Array.isArray(body.data);
      } catch (e) {
        return false;
      }
    },
  });

  sleep(Math.random() * 3 + 2); // 2-5 seconds dwell time

  // ─── STEP 3: Fetch Company Profile Details ──────────────────────────────
  const companyRes = http.get(`${BASE_URL}/companies/1`); // Accessing first company
  check(companyRes, {
    'get company returns 200': (r) => r.status === 200,
  });

  sleep(Math.random() * 2 + 1);

  // ─── STEP 4: Creating a Booking (Only authenticated users) ───────────────────
  if (token) {
    const bookingPayload = JSON.stringify({
      serviceId: '1',
      companyId: '1',
      bookingDate: '2026-06-15',
      startTime: '10:00',
      serviceAddress: '100 Load Testing Blvd, Tech City',
      latitude: 14.5995,
      longitude: 120.9842,
    });

    const bookingRes = http.post(`${BASE_URL}/bookings`, bookingPayload, { headers: authHeaders });
    check(bookingRes, {
      'booking created successfully': (r) => r.status === 201 || r.status === 200,
    });
  }

  sleep(Math.random() * 4 + 2);
}
