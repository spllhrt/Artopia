const mongoose = require("mongoose");
const notificationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    sentAt: {
        type: Date,
        default: Date.now
    },
    // Add data field to store navigation information
    data: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: () => ({})
    },
    // Track notification type
    notificationType: {
        type: String,
        enum: ['artwork', 'artmat', 'general'],
        default: 'general'
    },
    // For events with specific dates
    eventDate: {
        type: Date,
        default: null
    }
});

module.exports = mongoose.model("Notification", notificationSchema);