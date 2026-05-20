require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const routes = require('./routes');

const app = express();

// Connect to Database
connectDB();

app.use(cors());
app.use(express.json());

// Custom Request Logger Middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use('/api', routes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend is running on port ${PORT}`);
});
