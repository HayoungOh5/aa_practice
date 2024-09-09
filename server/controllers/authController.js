// controllers/authController.js
const { OAuth2Client } = require('google-auth-library');
const { verifyIdToken } = require('../utils/verifyJwt');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const fetch = require('node-fetch');

const refreshTokens = {}; // 메모리에 리프레시 토큰 저장
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

exports.getCode = async (req, res)=> {
    const { code } = req.query; // 구글로부터 전달받은 authorization code
    console.log("authorize code from google")
    console.log(code)
    res.redirect('http://localhost:3000?auth_code=' + code);
}

// get access token and refresh token by authorization code
exports.getTokens = async (req, res) => {
  const { code } = req.body;

  const params = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    redirect_uri: 'http://localhost:8080/callback', // 서버 리디렉션 URI
    grant_type: 'authorization_code'
  });

  try 
    {
      const response = await fetch(GOOGLE_TOKEN_URL, {
        method: 'POST',
        body: params,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      
      const data = await response.json();
      console.log(data);
      refreshTokens["token"] = data.refresh_token;
  
      console.log(`Succeed to get an access token: ${data.access_token}`);
      console.log(`Stored a refresh token: ${data.refresh_token}`);
  
      res.status(200).json({ 
          status: 'success', 
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          idToken: data.id_token
      });
  } catch (error) {
      console.error('Error fetching tokens:', error);
      res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.getNewIdToken = async (req, res) => {
  try {
    const id_token = req.body.id_token;
    console.log(id_token);
    console.log(refreshTokens.token);
    if (!id_token) {throw new Error("no id token")}
    if (!refreshTokens.token) {throw new Error("no refresh token")}
    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        refresh_token: refreshTokens.token,
        grant_type: 'refresh_token',
      })
    });
    const data = await response.json();
    console.log(data);

    try {
      const ticket = await client.verifyIdToken({
        idToken: data.id_token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      console.log(payload)
      res.json({ status: 'success', id_token: data.id_token, user: payload });
    } catch (error) {
      res.status(400).json({ status: 'error', message: error });
    }
  } catch (error) {
    res.status(400).json({ status: 'error', message: error });
  }
};

exports.verifyIdTokenByGoogle = async (req, res) => {
  const token = req.body.token;
  console.log("the given id_token is ", token)

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    res.json({ status: 'success', user: payload });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error });
  }
};