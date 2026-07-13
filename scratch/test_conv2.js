const test = async () => {
  try {
    const resLogin = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@example.com', password: 'password123' })
    });
    const loginData = await resLogin.json();
    console.log("LOGIN DATA:", loginData);
    const token = loginData?.token;

    const resGet = await fetch('http://localhost:5000/api/conversations', {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      }
    });
    const getList = await resGet.json();
    console.log("LIST:", JSON.stringify(getList, null, 2));
  } catch (err) {
    console.error(err);
  }
};
test();
