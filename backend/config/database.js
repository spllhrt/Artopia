const mongoose = require('mongoose');

const connectDatabase = async () => {
    await mongoose.connect(process.env.DB_URI); // ✅ Just pass the URI

    console.log(`MongoDB Database connected`);
};

module.exports = connectDatabase;
