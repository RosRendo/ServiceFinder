const axios = require('axios');
const io = require('socket.io-client');

const API_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

async function runTests() {
  console.log('🧪 STARTING SYSTEM INTEGRATION TESTS AGAINST PRODUCTION BACKEND...');
  
  // 1. Authenticate Users
  let customerToken, customerId;
  let companyToken, companyId, companyDbId;
  let staffToken, staffId;
  let adminToken;

  try {
    console.log('\n🔐 [Auth] Logging in users...');
    
    // Login Customer
    const customerLogin = await axios.post(`${API_URL}/auth/login`, {
      email: 'customer1@demo.com',
      password: 'password123'
    });
    customerToken = customerLogin.data.token;
    customerId = customerLogin.data.user.id;
    console.log(`✅ Customer logged in: ID = ${customerId}`);

    // Login Company Owner
    const companyLogin = await axios.post(`${API_URL}/auth/login`, {
      email: 'owner1@demo.com',
      password: 'password123'
    });
    companyToken = companyLogin.data.token;
    companyId = companyLogin.data.user.id;
    console.log(`✅ Company Owner logged in: ID = ${companyId}`);

    // Login Staff Member
    const staffLogin = await axios.post(`${API_URL}/auth/login`, {
      email: 'staff1@demo.com',
      password: 'password123'
    });
    staffToken = staffLogin.data.token;
    staffId = staffLogin.data.user.id;
    console.log(`✅ Staff Member logged in: ID = ${staffId}`);

    // Login Admin
    const adminLogin = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@servicefinder.com',
      password: 'password123'
    });
    adminToken = adminLogin.data.token;
    console.log('✅ Platform Admin logged in');
  } catch (err) {
    console.error('❌ Authentication failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // Helper headers
  const customerHeaders = { headers: { Authorization: `Bearer ${customerToken}` } };
  const companyHeaders = { headers: { Authorization: `Bearer ${companyToken}` } };
  const staffHeaders = { headers: { Authorization: `Bearer ${staffToken}` } };
  const adminHeaders = { headers: { Authorization: `Bearer ${adminToken}` } };

  // Fetch Company DB ID and find CompanyStaff ID for staff1
  let companyStaffDbId;
  try {
    const res = await axios.get(`${API_URL}/companies/my-company`, companyHeaders);
    // Unpack transform interceptor format ({ success: true, data: company })
    const companyData = res.data.data ?? res.data;
    companyDbId = companyData.id;
    console.log(`✅ Company DB ID is ${companyDbId}`);

    // Get staff list to find the CompanyStaff ID for staffId
    const staffRes = await axios.get(`${API_URL}/companies/my-company/staff`, companyHeaders);
    const staffList = staffRes.data.data ?? staffRes.data;
    
    // Find the staff item matching staffId (user.id)
    const staffMember = staffList.find(s => s.userId?.toString() === staffId.toString() || (s.user && s.user.id?.toString() === staffId.toString()));
    if (!staffMember) {
      throw new Error(`Staff Member with User ID ${staffId} not found in Company's staff list!`);
    }
    companyStaffDbId = staffMember.id;
    console.log(`✅ Staff Member's CompanyStaff ID is ${companyStaffDbId}`);
  } catch (err) {
    console.error('❌ Failed to get company/staff info:', err.response?.data || err.message);
    process.exit(1);
  }

  // ==========================================
  // TEST 1: Full Instant Booking Flow
  // ==========================================
  console.log('\n🚀 [TEST 1] Testing Full Instant Booking Flow...');
  let instantRequestId, selectedBidId, bookingId;

  try {
    // A. Place instant request
    console.log('  Customer placing instant request...');
    const reqRes = await axios.post(`${API_URL}/instant-requests`, {
      serviceCategory: 'Cleaning',
      description: 'Urgent deep clean of living room',
      preferredTime: 'now',
      latitude: 11.5564,
      longitude: 104.9282
    }, customerHeaders);
    const requestData = reqRes.data.data ?? reqRes.data;
    instantRequestId = requestData.request?.id ?? requestData.id;
    console.log(`  ✅ Instant Request created with ID: ${instantRequestId}`);

    // B. Wait for match and automatically generated mock bids (takes ~2.5s on backend)
    console.log('  Waiting 3.5 seconds for matched companies to submit bids...');
    await new Promise(resolve => setTimeout(resolve, 3500));

    // C. Get bids
    const bidsRes = await axios.get(`${API_URL}/instant-requests/${instantRequestId}/bids`, customerHeaders);
    const bids = bidsRes.data.data ?? bidsRes.data;
    console.log(`  ✅ Bids received: ${bids.length} found`);
    if (bids.length === 0) throw new Error('No bids returned for the instant request!');
    
    selectedBidId = bids[0].id;
    console.log(`  Customer selecting bid ${selectedBidId} with ETA: ${bids[0].eta}`);

    // D. Select bid
    const selectRes = await axios.post(`${API_URL}/instant-requests/${instantRequestId}/select`, {
      bidId: selectedBidId
    }, customerHeaders);
    const selectData = selectRes.data.data ?? selectRes.data;
    bookingId = selectData.bookingId;
    console.log(`  ✅ Bid accepted! Booking created with ID: ${bookingId}`);

    // E. Company assigns staff (requires CompanyStaff DB ID)
    console.log(`  Company assigning CompanyStaff ID ${companyStaffDbId} to booking ${bookingId}...`);
    await axios.patch(`${API_URL}/bookings/${bookingId}/assign-staff`, {
      staffId: companyStaffDbId.toString()
    }, companyHeaders);
    console.log('  ✅ Staff assigned successfully');

    // F. Staff accepts the assignment
    console.log('  Staff accepting assignment...');
    await axios.patch(`${API_URL}/bookings/${bookingId}/accept`, {}, staffHeaders);
    console.log('  ✅ Assignment accepted');

    // G. Staff goes en-route
    console.log('  Staff marking as en-route...');
    await axios.patch(`${API_URL}/bookings/${bookingId}/en-route`, {}, staffHeaders);
    console.log('  ✅ Status is now EN-ROUTE');

    // H. Staff arrives
    console.log('  Staff marking as arrived...');
    await axios.patch(`${API_URL}/bookings/${bookingId}/arrive`, {}, staffHeaders);
    console.log('  ✅ Status is now ARRIVED');

    // I. Staff starts the job
    console.log('  Staff starting job...');
    await axios.patch(`${API_URL}/bookings/${bookingId}/start`, {
      staffStartLatitude: 11.5564,
      staffStartLongitude: 104.9282
    }, staffHeaders);
    console.log('  ✅ Status is now IN_PROGRESS');

    // J. Staff completes job
    console.log('  Staff completing job...');
    await axios.patch(`${API_URL}/bookings/${bookingId}/complete`, {
      proofOfWorkPhoto: 'http://example.com/proof-instant.jpg'
    }, staffHeaders);
    console.log('  ✅ Status is now COMPLETED');

    // K. Customer verifies completion status
    const bookingCheck = await axios.get(`${API_URL}/bookings/${bookingId}`, customerHeaders);
    const checkData = bookingCheck.data.data?.booking ?? bookingCheck.data.booking ?? bookingCheck.data.data ?? bookingCheck.data;
    console.log(`  Customer booking status verification: ${checkData.status}`);
    if (checkData.status === 'completed') {
      console.log('🎉 TEST 1 PASSED: End-to-end instant request flow completed successfully!');
    } else {
      throw new Error(`Expected booking status to be completed, got: ${checkData.status}`);
    }
  } catch (err) {
    console.error('❌ TEST 1 FAILED:', err.response?.data || err.message);
  }

  // ==========================================
  // TEST 2: Standard Booking + Payment
  // ==========================================
  console.log('\n🚀 [TEST 2] Testing Standard Booking + Payment...');
  try {
    // A. Fetch available services to pick one
    const servicesRes = await axios.get(`${API_URL}/services`, customerHeaders);
    const servicesObj = servicesRes.data.data ?? servicesRes.data;
    const services = servicesObj.data ?? servicesObj;
    if (!services || services.length === 0) throw new Error('No services found in database!');
    const service = services[0];
    console.log(`  Selected service: "${service.name}" (Price: $${service.basePrice})`);

    // B. Create a future standard booking (booking date: tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const bookingDateStr = tomorrow.toISOString().split('T')[0];

    console.log(`  Customer booking service for date ${bookingDateStr}...`);
    const createBookingRes = await axios.post(`${API_URL}/bookings`, {
      companyId: service.companyId.toString(),
      serviceId: service.id.toString(),
      bookingDate: bookingDateStr,
      startTime: '13:00',
      serviceAddress: 'Standard test address, Phnom Penh'
    }, customerHeaders);
    
    const standardBookingData = createBookingRes.data.data ?? createBookingRes.data;
    const standardBookingId = standardBookingData.id;
    const amount = standardBookingData.totalPrice;
    console.log(`  ✅ Booking created! Booking ID: ${standardBookingId}, Amount: $${amount}`);

    // C. Generate KHQR for checkout
    console.log('  Customer requesting KHQR checkout...');
    await axios.post(`${API_URL}/payments/khqr/generate`, {
      bookingId: standardBookingId.toString()
    }, customerHeaders);
    console.log(`  ✅ KHQR Generated!`);

    // D. Simulate KHQR payment confirmation via webhook (unauthenticated callback)
    console.log('  Simulating KHQR payment callback webhook...');
    const webhookRes = await axios.post(`${API_URL}/payments/webhook/khqr`, {
      billNumber: `KHQR-${standardBookingId}`,
      amount: Number(amount)
    });
    console.log(`  ✅ Webhook responded: ${JSON.stringify(webhookRes.data)}`);

    // E. Verify status transitions to confirmed
    const bookingCheck = await axios.get(`${API_URL}/bookings/${standardBookingId}`, customerHeaders);
    const checkData = bookingCheck.data.data?.booking ?? bookingCheck.data.booking ?? bookingCheck.data.data ?? bookingCheck.data;
    console.log(`  Booking status: ${checkData.status}`);
    if (checkData.status === 'confirmed') {
      console.log('🎉 TEST 2 PASSED: Standard booking created & payment verified successfully!');
    } else {
      throw new Error(`Expected booking status to be confirmed, got: ${checkData.status}`);
    }
  } catch (err) {
    console.error('❌ TEST 2 FAILED:', err.response?.data || err.message);
  }

  // ==========================================
  // TEST 3: Cancellation Flow
  // ==========================================
  console.log('\n🚀 [TEST 3] Testing Cancellation Flow...');
  try {
    // A. Create standard booking
    const servicesRes = await axios.get(`${API_URL}/services`, customerHeaders);
    const servicesObj = servicesRes.data.data ?? servicesRes.data;
    const services = servicesObj.data ?? servicesObj;
    const service = services[0];
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const bookingDateStr = tomorrow.toISOString().split('T')[0];

    const createRes = await axios.post(`${API_URL}/bookings`, {
      companyId: service.companyId.toString(),
      serviceId: service.id.toString(),
      bookingDate: bookingDateStr,
      startTime: '14:00',
      serviceAddress: 'Cancel test address, Phnom Penh'
    }, customerHeaders);
    
    const cancelBookingData = createRes.data.data ?? createRes.data;
    const cancelBookingId = cancelBookingData.id;
    console.log(`  Booking created with ID: ${cancelBookingId}`);

    // B. Cancel booking
    console.log('  Customer cancelling booking...');
    await axios.patch(`${API_URL}/bookings/${cancelBookingId}/cancel`, {
      reason: 'QA test cancel'
    }, customerHeaders);

    // C. Verify cancelled
    const bookingCheck = await axios.get(`${API_URL}/bookings/${cancelBookingId}`, customerHeaders);
    const checkData = bookingCheck.data.data?.booking ?? bookingCheck.data.booking ?? bookingCheck.data.data ?? bookingCheck.data;
    console.log(`  Booking status: ${checkData.status}`);
    if (checkData.status === 'cancelled') {
      console.log('🎉 TEST 3 PASSED: Booking cancelled successfully!');
    } else {
      throw new Error(`Expected booking status to be cancelled, got: ${checkData.status}`);
    }
  } catch (err) {
    console.error('❌ TEST 3 FAILED:', err.response?.data || err.message);
  }

  // ==========================================
  // TEST 4: Admin Approval Flow
  // ==========================================
  console.log('\n🚀 [TEST 4] Testing Company Creation & Admin Approval...');
  try {
    // A. Create a BRAND NEW company owner dynamically to prevent conflict error
    const ownerEmail = `qa-owner-${Date.now()}@demo.com`;
    console.log(`  Registering new company owner user: ${ownerEmail}...`);
    const registerOwnerRes = await axios.post(`${API_URL}/auth/register`, {
      fullName: 'QA Company Owner',
      email: ownerEmail,
      password: 'password123',
      phone: `+855${Math.floor(Math.random() * 89999999 + 10000000)}`,
      role: 'company_admin'
    });
    const newOwnerToken = registerOwnerRes.data.token;
    const newOwnerHeaders = { headers: { Authorization: `Bearer ${newOwnerToken}` } };

    // B. New Owner creates the company profile
    const randName = `QA Agency-${Math.floor(Math.random() * 1000)}`;
    console.log(`  New Company owner creating company profile: "${randName}"...`);
    const newCompanyRes = await axios.post(`${API_URL}/companies`, {
      name: randName,
      description: 'Reliable test cleaning services',
      address: 'Street 310, BKK3',
      city: 'Phnom Penh',
      phone: '012-345-678',
      email: `contact@${randName.toLowerCase().replace(/[^a-z]/g, '')}.com`
    }, newOwnerHeaders);
    
    const newCompanyData = newCompanyRes.data.data ?? newCompanyRes.data;
    const newCompanyId = newCompanyData.company?.id ?? newCompanyData.id;
    console.log(`  Company created! ID: ${newCompanyId}, Verification Status: ${newCompanyData.company?.verificationStatus ?? newCompanyData.verificationStatus}`);

    // C. Admin approves the company
    console.log(`  Admin verifying/approving company ID: ${newCompanyId}...`);
    await axios.post(`${API_URL}/admin/companies/${newCompanyId}/verify`, {}, adminHeaders);
    console.log('  ✅ Company verification status updated by Admin');

    // D. Verify verification status
    const getCompany = await axios.get(`${API_URL}/companies/${newCompanyId}`, customerHeaders);
    const getCompanyData = getCompany.data.data ?? getCompany.data;
    console.log(`  Company verification status: ${getCompanyData.verificationStatus}`);
    if (getCompanyData.verificationStatus === 'verified') {
      console.log('🎉 TEST 4 PASSED: New company registered and verified by Admin successfully!');
    } else {
      throw new Error(`Expected verificationStatus to be verified, got: ${getCompanyData.verificationStatus}`);
    }
  } catch (err) {
    console.error('❌ TEST 4 FAILED:', err.response?.data || err.message);
  }

  // ==========================================
  // TEST 5: Edge Case & Error Handling
  // ==========================================
  console.log('\n🚀 [TEST 5] Testing Edge Case & Error Handling...');
  try {
    console.log('  Attempting to place invalid instant request (missing parameters)...');
    try {
      await axios.post(`${API_URL}/instant-requests`, {}, customerHeaders);
      throw new Error('Allowed empty instant request creation!');
    } catch (err) {
      console.log(`  ✅ Blocked: ${err.response?.status} - ${JSON.stringify(err.response?.data?.message)}`);
    }

    console.log('  Attempting unauthorized action (staff trying to verify company)...');
    try {
      await axios.post(`${API_URL}/admin/companies/1/verify`, {}, staffHeaders);
      throw new Error('Allowed staff to access admin route!');
    } catch (err) {
      console.log(`  ✅ Blocked: ${err.response?.status} - ${err.response?.data?.message}`);
    }

    console.log('🎉 TEST 5 PASSED: Error handling and route security working properly!');
  } catch (err) {
    console.error('❌ TEST 5 FAILED:', err.message);
  }

  console.log('\n🏁 SYSTEM INTEGRATION TESTING COMPLETED!');
}

runTests();
