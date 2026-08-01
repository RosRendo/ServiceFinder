async function test() {
  try {
    // 1. Login
    const loginRes = await fetch('http://127.0.0.1:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'jake.eco@staff.com', password: 'password123' })
    });
    
    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log("Logged in successfully. Token length:", token ? token.length : 0);

    if (!token) {
       console.log("Login failed!", loginData);
       return;
    }

    // 2. Fetch my-assignments
    const jobsRes = await fetch('http://127.0.0.1:5000/api/bookings/my-assignments', {
      headers: { Authorization: `Bearer ${token}` }
    });

    const jobsData = await jobsRes.json();
    console.log("Status:", jobsRes.status);
    console.log("Data keys:", Object.keys(jobsData));
    console.log("Bookings count:", jobsData.bookings?.length);
    if (jobsData.bookings?.length > 0) {
      console.log("All booking statuses:", jobsData.bookings.map(b => b.status).join(', '));
    } else {
      console.log(JSON.stringify(jobsData, null, 2));
    }

  } catch (e) {
    console.error("Error Message:", e.message);
  }
}

test();
