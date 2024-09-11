import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const api = process.env.REACT_APP_BACKEND_URL;

const App = () => {
  const [currentTime, setCurrentTime] = useState(Math.floor(Date.now() / 1000));
  const [idToken, setIdToken] = useState(null);
  const [authCode, setAuthCode] = useState(null);
  const [idTokenInfo1, setIdTokenInfo1] = useState(null);
  const [refreshToken, setRefreshToken] = useState('');
  const [isExpired, setIsExpired] = useState(false);
  const [temp_acc, setTempAcc] = useState(null);
  const [aa_addr, setAaAddr] = useState(null);
  const [operation, setOperation] = useState('');
  const [accountInfo, setAccountInfo] = useState('');
  const [showToken, setShowToken] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const toggleToken = () => setShowToken(!showToken);

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const code = query.get('auth_code');
    
    if (code) {
      setAuthCode(code);
      console.log('Authorization Code:', code);
      navigate('/', { replace: true });
    }

    const timeInterval = setInterval(() => setCurrentTime(Math.floor(Date.now() / 1000)), 1000);
    const tokenInterval = setInterval(() => {
      if (idTokenInfo1) setIsExpired(idTokenInfo1.exp <= currentTime);
    }, 1000);

    return () => {
      clearInterval(timeInterval);
      clearInterval(tokenInterval);
    };
  }, [location.search, navigate, temp_acc, currentTime, idToken, idTokenInfo1]);

  const getAuthCode = (clientId) => {
    const redirectUri = 'http://localhost:8080/callback';
    const authUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid profile email&access_type=offline`;
    window.location.href = authUrl;
  };

  const request = async (url, method, body = null) => {
    const options = { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : null };
    const res = await fetch(api + url, options);
    return res.json();
  };

  const issueToken = async () => {
    try {
      const { status, idToken, refreshToken } = await request('/auth/tokens', 'POST', { code: authCode });
      if (status !== 'success') throw new Error("Failed to issue tokens");

      setIdToken(idToken);
      setRefreshToken(refreshToken);
      await verifyIdToken(idToken);
      await createAccount();
    } catch (error) {
      console.error("Token issuance error:", error);
    }
  };

  const verifyIdToken = async (token) => {
    try {
      const { status, user } = await request('/auth/verify/idtoken/google', 'POST', { token });
      if (status !== 'success') throw new Error("Token verification failed");

      setIdTokenInfo1(user);
    } catch (error) {
      console.error("Token verification error:", error);
    }
  };

  const getNewIdToken = async () => {
    try {
      const { status, id_token, user } = await request('/auth/get/newidtoken', 'POST', { id_token: idToken });
      if (status !== 'success') throw new Error("Failed to refresh ID token");
      console.log(id_token);
      console.log(user)
      setIdToken(id_token);
      setIdTokenInfo1(user);
      await updateKey();
    } catch (error) {
      console.error("Error refreshing ID token:", error);
    }
  };

  const updateKey = async () => {
    console.log("updateKey")
    try {
      const { status, temp_acc } = await request('/mitum/account/updatekey', 'POST');
      if (status !== 'success') throw new Error("Failed to update key");
      console.log(temp_acc)
      setTempAcc(temp_acc);
    } catch (error) {
      console.error("Error updating key:", error);
    }
  };

  const createAccount = async () => {
    try {
      const { status, temp_acc, aa_address } = await request('/mitum/account/create', 'GET');
      if (status !== 'success') throw new Error("Failed to create account");

      setTempAcc(temp_acc);
      setAaAddr(aa_address);
    } catch (error) {
      console.error("Account creation error:", error);
    }
  };

  const handleTransfer = async () => {
    try {
      const { status, operation } = await request('/mitum/account/transfer', 'POST', { expired_time: idToken.exp });
      if (status !== 'success') throw new Error("Transfer failed");

      setOperation(operation);
    } catch (error) {
      console.error("Error during transfer:", error);
    }
  };

  const handleGetInfo = async () => {
    try {
      const { status, result } = await request('/mitum/account/getinfo', 'GET');
      if (status !== 'success') throw new Error("Failed to get account information");

      setAccountInfo(result.data[0]);
    } catch (error) {
      console.error("Error getting account information:", error);
    }
  };
  return (
    <div>
      <h1>Account Abstraction with Google OAuth 2.0</h1>
      <p>Current UTC Time: {currentTime}</p>
  
      {idTokenInfo1 && (
        <div>
          <p>Expired Time: {idTokenInfo1.exp}</p>
          <p>isExpired   : {isExpired.toString()}</p>
        </div>
      )}
  
      <button onClick={getNewIdToken}>Get new ID token (update temp key)</button>
  
      <hr style={{ margin: '10px 0 20px' }} />
  
      <div>
        <p>Google 로그인 하여 계정 생성 ⬇️</p>
        {authCode ? null : (
          <button onClick={() => getAuthCode(process.env.REACT_APP_GOOGLE_CLIENT_ID)}>
            Login with Google
          </button>
        )}
        <button onClick={issueToken}>계정 생성하기</button>
      </div>
  
      <h3>ID token & Refresh token</h3>
      {idToken && (
        <div onClick={toggleToken} style={{ cursor: 'pointer', wordBreak: 'break-all' }}>
          {!showToken ? idToken.slice(0, 120) + '...' : idToken}
        </div>
      )}
  
      {refreshToken && (
        <div onClick={toggleToken} style={{ cursor: 'pointer', wordBreak: 'break-all' }}>
          {!showToken ? refreshToken.slice(0, 120) + '...' : refreshToken}
        </div>
      )}
  
      <h3>User Info from ID token</h3>
      {idTokenInfo1 ? <pre>{JSON.stringify(idTokenInfo1, null, 2)}</pre> : <p>null</p>}
  
      <h3>Temp Account, AA Account</h3>
      <div>
        <p>Temp Account:</p>
        <pre>{JSON.stringify(temp_acc, null, 2)}</pre>
        <p>AA Account: {aa_addr}</p>
      </div>
  
      <button onClick={handleGetInfo}>Get Balance of AA account</button>
      {accountInfo ? <pre>{JSON.stringify(accountInfo, null, 2)}</pre> : <p>null</p>}
  
      <button onClick={handleTransfer}>Transfer using AA account</button>
      {operation && (
        <div>
          <p>Operation</p>
          <pre>{JSON.stringify(operation, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default App;
