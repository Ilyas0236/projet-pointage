const axios = require('axios');

async function test() {
  try {
    const loginRes = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@entreprise.com',
      password: 'admin'
    });
    const token = loginRes.data.token;
    console.log('Login success, token:', token.substring(0, 20) + '...');

    const pointagesRes = await axios.get('http://localhost:3000/api/pointage', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Pointages fetched:', pointagesRes.data.length);
    if (pointagesRes.data.length > 0) {
      console.log('First pointage:', pointagesRes.data[0]);
    } else {
      console.log('NO POINTAGES RETURNED');
    }
  } catch (err) {
    console.error('Error:', err.response?.data || err.message);
  }
}

test();
