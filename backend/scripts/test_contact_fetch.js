const axios = require('axios');

(async () => {
  try {
    const base = 'http://localhost:5000/api';
    // Login
    const login = await axios.post(`${base}/auth/login`, { username: 'admin', password: 'admin123' });
    const token = login.data.token;
    console.log('Token:', !!token);

    // Fetch contact list
    const list = await axios.get(`${base}/contact`, { headers: { Authorization: `Bearer ${token}` } });
    console.log('Messages count:', list.data.length);

    // Fetch message id 5
    const single = await axios.get(`${base}/contact/5`, { headers: { Authorization: `Bearer ${token}` } });
    console.log('Single message:', single.data);

    // Delete message id 5 (test)
    // const del = await axios.delete(`${base}/contact/5`, { headers: { Authorization: `Bearer ${token}` } });
    // console.log('Delete response:', del.data);

  } catch (err) {
    if (err.response) {
      console.error('HTTP error:', err.response.status, err.response.data);
    } else {
      console.error('Error:', err.message);
    }
  }
})();
