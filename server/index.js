// index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 8080;

// CORS 설정
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());

// 라우트 설정
app.use('/', authRoutes);


// 서버 실행
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});