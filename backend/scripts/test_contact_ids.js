const axios = require('axios');

(async () => {
  try {
    const base = 'http://localhost:5000/api';
    const login = await axios.post(`${base}/auth/login`, { username: 'admin', password: 'admin123' });
    const token = login.data.token;
    console.log('Token present:', !!token);

    const list = await axios.get(`${base}/contact`, { headers: { Authorization: `Bearer ${token}` } });
    console.log('Total messages:', list.data.length);

    for (let msg of list.data) {
      try {
        const res = await axios.get(`${base}/contact/${msg.id}`, { headers: { Authorization: `Bearer ${token}` } });
        console.log(`GET /contact/${msg.id} ->`, res.status);
      } catch (err) {
        console.log(`GET /contact/${msg.id} ERROR:`, err.response ? err.response.status : err.message);
      }

      try {
        const del = await axios.delete(`${base}/contact/${msg.id}`, { headers: { Authorization: `Bearer ${token}` } });
        console.log(`DELETE /contact/${msg.id} ->`, del.status);
      } catch (err) {
        console.log(`DELETE /contact/${msg.id} ERROR:`, err.response ? err.response.status : err.message);
      }
    }
  } catch (err) {
    console.error(err);
  }
})();
