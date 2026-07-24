fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: "owner1@example.com", password: "password123" })
}).then(res => res.text()).then(console.log).catch(console.error);
