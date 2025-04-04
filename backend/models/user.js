const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Token expiration period in days
const TOKEN_EXPIRATION_DAYS = 30;

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter your name'],
        maxLength: [30, 'Your name cannot exceed 30 characters']
    },
    email: {
        type: String,
        required: [true, 'Please enter your email'],
        unique: true,
        validate: [validator.isEmail, 'Please enter valid email address']
    },
    password: {
        type: String,
        required: [true, 'Please enter your password'],
        minlength: [6, 'Your password must be longer than 6 characters'],
        select: false
    },
    avatar: {
        public_id: {
            type: String,
        },
        url: {
            type: String,
        }
    },
    role: {
        type: String,
        default: 'user'
    },
    // Enhanced push token fields with expiration
    pushToken: { 
        type: String, 
        default: null 
    },
    pushTokenExpires: {
        type: Date,
        default: null
    },
    pushTokenLastValidated: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date
})

// Method to check if push token has expired
userSchema.methods.isPushTokenExpired = function() {
    // If there's no token or expiration date, consider it expired
    if (!this.pushToken || !this.pushTokenExpires) {
        return true;
    }
    
    // Check if current date is past the expiration date
    return Date.now() > this.pushTokenExpires;
};

// Method to set a new push token with expiration
userSchema.methods.setPushToken = function(token) {
    this.pushToken = token;
    
    // Set expiration date (30 days from now by default)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + TOKEN_EXPIRATION_DAYS);
    this.pushTokenExpires = expiryDate;
    
    // Mark as validated now
    this.pushTokenLastValidated = new Date();
};

// Method to mark token as validated (without changing the token)
userSchema.methods.markTokenAsValidated = function() {
    this.pushTokenLastValidated = new Date();
    
    // Optional: extend expiration date when validated
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + TOKEN_EXPIRATION_DAYS);
    this.pushTokenExpires = expiryDate;
};

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next()
    }
    this.password = await bcrypt.hash(this.password, 10)  // Hash password before saving
});

userSchema.methods.getJwtToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_TIME
    });
}

userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
}

module.exports = mongoose.model('User', userSchema);