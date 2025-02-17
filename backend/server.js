const express = require("express");
const app = express();
const connectDatabase = require('./config/database')
const cloudinary = require('cloudinary').v2;
const cors = require('cors')
require('dotenv').config();

const cookieParser = require('cookie-parser');

app.use(cookieParser());


const PORT = process.env.PORT || 5000;

app.use(express.json({limit:'50mb'}));
app.use(express.urlencoded({limit: "50mb", extended: true }));
const corsOptions = {
    origin: `http://192.168.1.3:${PORT}`,  // Replace with your frontend URL (e.g., 'http://localhost:3000' for development)
    credentials: true,  // Allow cookies to be sent with the request
  };
  
  app.use(cors(corsOptions));
  

const auth = require('./routes/auth');


connectDatabase();
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

app.use('/api/', auth);

app.listen(PORT, () => {
    console.log(`✅ Server running on http://192.168.1.3:${PORT}`);
});
