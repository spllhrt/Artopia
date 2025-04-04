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
    origin: process.env.CORS_ORIGIN,  // eto babaguhin
    credentials: true, 
  };
  
  app.use(cors(corsOptions));
  

const auth = require('./routes/auth');
const artwork = require('./routes/artwork');
const artmat = require('./routes/artmat');
const order = require('./routes/order');
const pushNotif = require("./routes/pushNotif");


connectDatabase();
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})


app.use('/api/', auth);
app.use('/api/', artwork);
app.use('/api/', artmat);
app.use('/api/', order);
app.use("/api/", pushNotif);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
