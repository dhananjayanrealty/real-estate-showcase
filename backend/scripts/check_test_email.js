const axios = require('axios');
(async()=>{
  try{
    const base='http://localhost:5000/api';
    const login = await axios.post(base+'/auth/login',{username:'admin',password:'admin123'});
    const token=login.data.token;
    console.log('token ok', !!token);
    const res = await axios.get(base+'/contact/test-email',{headers:{Authorization:`Bearer ${token}`}});
    console.log('test-email response:', res.data);
  }catch(e){
    if(e.response) console.error('HTTP',e.response.status,e.response.data);
    else console.error(e.message);
  }
})();
