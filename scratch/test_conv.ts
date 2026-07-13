import axios from 'axios';

const test = async () => {
  try {
    const resLogin = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@servicefinder.com', // or whatever the admin is
      password: 'password123',
    });
    const token = resLogin.data.data.accessToken;

    const res = await axios.post('http://localhost:5000/api/conversations', {
      targetUserId: '2', // some user id
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(res.data);
  } catch (err) {
    console.error(err.response?.data || err.message);
  }
};
test();
