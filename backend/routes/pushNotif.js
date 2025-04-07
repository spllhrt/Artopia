const express = require("express");
const { Expo } = require("expo-server-sdk");
const User = require("../models/user");
const Artwork = require("../models/artwork");
const Artmat = require("../models/artmat");
const Notification = require('../models/notification');
const Order = require("../models/order");
const router = express.Router();
const mongoose = require("mongoose");

const VALIDATION_INTERVAL_DAYS = 1;

// Save Push Token (Only for Regular Users)
router.post("/save-push-token", async (req, res) => {
    const { userId, pushToken } = req.body;

    if (!userId || !pushToken) {
        return res.status(400).json({ error: "Missing data" });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Restrict push tokens to regular users only (not admins)
        if (user.role !== "user") {
            return res.status(403).json({ error: "Only regular users can register push tokens." });
        }

        // Validate token format
        if (!Expo.isExpoPushToken(pushToken)) {
            return res.status(400).json({ error: "Invalid push token format" });
        }

        // Save push token with expiration
        user.setPushToken(pushToken);
        await user.save();

        console.log("✅ Push token saved for user:", user._id, "expires:", user.pushTokenExpires);
        res.json({ 
            message: "Push token saved", 
            expiresAt: user.pushTokenExpires
        });
    } catch (error) {
        console.error("❌ Error saving push token:", error);
        res.status(500).json({ error: "Failed to save token" });
    }
});

router.post("/cleanup-tokens", async (req, res) => {
    const expo = new Expo();
    try {
        const users = await User.find({ pushToken: { $ne: null } });
        
        let validationErrors = [];
        let expiredCount = 0;
        let invalidFormatCount = 0;
        let invalidTokenCount = 0;
        let validatedCount = 0;
        
        const now = new Date();
        
        for (const user of users) {
            if (!user.pushToken) continue;
            
            if (user.isPushTokenExpired()) {
                console.log(`⏰ Expired token for user ${user._id}, expired on ${user.pushTokenExpires}`);
                user.pushToken = null;
                user.pushTokenExpires = null;
                user.pushTokenLastValidated = null;
                await user.save();
                expiredCount++;
                continue;
            }
            
            if (!Expo.isExpoPushToken(user.pushToken)) {
                console.log(`❌ Invalid token format for user ${user._id}: ${user.pushToken}`);
                user.pushToken = null;
                user.pushTokenExpires = null;
                user.pushTokenLastValidated = null;
                await user.save();
                invalidFormatCount++;
                continue;
            }
            
            const validationDate = user.pushTokenLastValidated || new Date(0);
            const daysSinceValidation = Math.floor((now - validationDate) / (1000 * 60 * 60 * 24));
            
            if (daysSinceValidation >= VALIDATION_INTERVAL_DAYS) {
                console.log(`🔄 Validating token for user ${user._id}, last validated ${daysSinceValidation} days ago`);
                
                try {
                    const messages = [{
                        to: user.pushToken,
                        body: "Token validation check",
                        data: { type: 'silent_validation' },
                        _displayInForeground: false,
                    }];
                    
                    const chunks = expo.chunkPushNotifications(messages);
                    for (let chunk of chunks) {
                        let tickets = await expo.sendPushNotificationsAsync(chunk);
                        
                        if (tickets[0].status === "error") {
                            console.log(`❌ Invalid token for user ${user._id}: ${tickets[0].message}`);
                            validationErrors.push({ userId: user._id, error: tickets[0].message });
                            
                            user.pushToken = null;
                            user.pushTokenExpires = null;
                            user.pushTokenLastValidated = null;
                            await user.save();
                            invalidTokenCount++;
                        } else {
                            user.markTokenAsValidated();
                            await user.save();
                            validatedCount++;
                        }
                    }
                } catch (err) {
                    console.error(`❌ Error validating token for user ${user._id}:`, err);
                    user.pushToken = null;
                    user.pushTokenExpires = null;
                    user.pushTokenLastValidated = null;
                    await user.save();
                    invalidTokenCount++;
                }
            } else {
                console.log(`✓ Skipping validation for user ${user._id}, validated ${daysSinceValidation} days ago`);
            }
        }
        
        res.json({ 
            message: `Token cleanup complete.`,
            stats: {
                expired: expiredCount,
                invalidFormat: invalidFormatCount,
                invalidToken: invalidTokenCount,
                validated: validatedCount,
                total: users.length
            },
            errors: validationErrors
        });
    } catch (error) {
        console.error("❌ Error during token cleanup:", error);
        res.status(500).json({ error: "Failed to clean up tokens" });
    }
});

// Added route to check token status for a user
router.get("/token-status/:userId", async (req, res) => {
    const { userId } = req.params;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (!user.pushToken) {
            return res.json({ 
                status: "no_token",
                message: "No push token registered for this user" 
            });
        }

        const isExpired = user.isPushTokenExpired();
        const daysUntilExpiration = user.pushTokenExpires ? 
            Math.floor((user.pushTokenExpires - Date.now()) / (1000 * 60 * 60 * 24)) : 0;

        res.json({
            status: isExpired ? "expired" : "valid",
            token: user.pushToken.substring(0, 10) + "..." + user.pushToken.substring(user.pushToken.length - 5),
            expiresAt: user.pushTokenExpires,
            daysUntilExpiration: Math.max(0, daysUntilExpiration),
            lastValidated: user.pushTokenLastValidated
        });
    } catch (error) {
        console.error("❌ Error checking token status:", error);
        res.status(500).json({ error: "Failed to check token status" });
    }
});


// Send promotional notifications for new artwork
router.post("/promote-artwork", async (req, res) => {
    const { artworkId } = req.body;

    if (!artworkId) return res.status(400).json({ error: "Artwork ID required" });

    try {
        // Find the artwork to promote
        const artwork = await Artwork.findById(artworkId);
        if (!artwork) {
            return res.status(404).json({ error: "Artwork not found" });
        }

        // Create notification in database
        const newNotification = new Notification({
            title: `New Artwork: ${artwork.title}`,
            message: `Discover "${artwork.title}" by ${artwork.artist}, now available for ₱${artwork.price}`,
            sentAt: new Date(),
            data: { type: 'artwork', id: artwork._id }
        });
        await newNotification.save();

        // Send push notification to all users
        const expo = new Expo();
        const users = await User.find({ pushToken: { $ne: null } });

        const messages = users.map(user => ({
            to: user.pushToken,
            sound: "default",
            title: `New Artwork: ${artwork.title}`,
            body: `Discover "${artwork.title}" by ${artwork.artist}, now available for ₱${artwork.price}`,
            data: { type: 'artwork', id: artwork._id }
        }));

        console.log(`🎨 Promoting artwork to ${messages.length} users:`, artwork.title);

        const chunks = expo.chunkPushNotifications(messages);
        for (let chunk of chunks) {
            let ticket = await expo.sendPushNotificationsAsync(chunk);
            console.log("📨 Expo Push Response:", ticket);
        }

        res.json({ 
            message: "Artwork promotion sent successfully", 
            artwork: artwork.title,
            recipientCount: messages.length 
        });
    } catch (error) {
        console.error("❌ Error promoting artwork:", error);
        res.status(500).json({ error: "Failed to promote artwork" });
    }
});

// In your route file (e.g., routes.js)
router.post("/promote-artmat", async (req, res) => {
    const { artmatId } = req.body;

    if (!artmatId) return res.status(400).json({ error: "Art material ID required" });

    try {
        // Find the art material to promote
        const artmat = await Artmat.findById(artmatId);
        if (!artmat) {
            return res.status(404).json({ error: "Art material not found" });
        }

        // Create notification in database
        const newNotification = new Notification({
            title: `New Art Material: ${artmat.name}`,
            message: `Check out our new ${artmat.name} - ${artmat.description.substring(0, 50)}...`,
            sentAt: new Date(),
            data: { type: 'artmat', id: artmat._id } // Add data field for navigation
        });
        await newNotification.save();
        console.log("Notification saved:", newNotification); // Log the saved notification

        // Send push notification to all users
        const expo = new Expo();
        const users = await User.find({ pushToken: { $ne: null } });

        const messages = users.map(user => ({
            to: user.pushToken,
            sound: "default",
            title: `New Art Material: ${artmat.name}`,
            body: `Check out our new ${artmat.name} - ${artmat.description.substring(0, 50)}...`,
            data: { type: 'artmat', id: artmat._id } // Include data for navigation
        }));

        console.log(`🖌️ Promoting art material to ${messages.length} users:`, artmat.name);

        const chunks = expo.chunkPushNotifications(messages);
        for (let chunk of chunks) {
            let ticket = await expo.sendPushNotificationsAsync(chunk);
            console.log("📨 Expo Push Response:", ticket);
        }

        res.json({ 
            message: "Art material promotion sent successfully", 
            artmat: artmat.name,
            recipientCount: messages.length 
        });
    } catch (error) {
        console.error("❌ Error promoting art material:", error);
        res.status(500).json({ error: "Failed to promote art material" });
    }
});

// Get all notifications
router.get("/notifications", async (req, res) => {
    try {
        const notifications = await Notification.find().sort({ sentAt: -1 });
        res.json({ notifications });
    } catch (error) {
        console.error("❌ Error fetching notifications:", error);
        res.status(500).json({ error: "Failed to fetch notifications" });
    }
});

// Get notification by ID
router.get("/notifications/:id", async (req, res) => {
    const notificationId = req.params.id;

    // ✅ Check if notificationId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
        return res.status(400).json({ error: "Invalid notification ID format" });
    }

    try {
        // Find notification by ID
        const notification = await Notification.findById(notificationId);

        // If the notification doesn't exist, return a 404 error
        if (!notification) {
            return res.status(404).json({ error: "Notification not found" });
        }

        // Return the notification as a JSON response
        res.json({ notification });
    } catch (error) {
        // Catch any errors and log them
        console.error("❌ Error fetching notification:", error);
        res.status(500).json({ error: "Failed to fetch notification" });
    }
});

// Delete notification by ID
router.delete("/notifications/:id", async (req, res) => {
    const notificationId = req.params.id;

    try {
        const notification = await Notification.findByIdAndDelete(notificationId);

        if (!notification) {
            return res.status(404).json({ error: "Notification not found" });
        }

        res.json({ message: "Notification deleted" });
    } catch (error) {
        console.error("❌ Error deleting notification:", error);
        res.status(500).json({ error: "Failed to delete notification" });
    }
});

// Send notification for order update
router.post("/notify-order-update", async (req, res) => {
    const { orderId, status, message } = req.body;

    if (!orderId) {
        return res.status(400).json({ error: "Order ID required" });
    }

    try {
        // Find the order to include details
        const order = await Order.findById(orderId).populate('user');
        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }

        // Default message if none provided
        const notificationMessage = message || 
            `Your order #${order._id.toString()} has been updated to: ${status}`;

        // Create notification in database
        const newNotification = new Notification({
            title: `Order Update: #${order._id.toString()}`,
            message: notificationMessage,
            sentAt: new Date(),
            data: { type: 'order', id: order._id }
        });
        await newNotification.save();

        // Check if we have a user with push token
        if (!order.user || !order.user.pushToken) {
            return res.json({ 
                message: "Notification saved but push not sent (no valid recipient)",
                notification: newNotification._id
            });
        }

        // Send push notification to the user
        const expo = new Expo();
        const pushMessage = {
            to: order.user.pushToken,
            sound: "default",
            title: `Order Update: #${order._id.toString()}`,
            body: notificationMessage,
            data: { type: 'order', id: order._id.toString() }
        };

        console.log(`📦 Sending order update notification to user:`, order.user._id);

        const chunks = expo.chunkPushNotifications([pushMessage]);
        for (let chunk of chunks) {
            let ticket = await expo.sendPushNotificationsAsync(chunk);
            console.log("📨 Expo Push Response:", ticket);
        }

        res.json({ 
            message: "Order update notification sent successfully", 
            orderId: order._id,
            notificationId: newNotification._id
        });
    } catch (error) {
        console.error("❌ Error sending order update notification:", error);
        res.status(500).json({ error: "Failed to send order notification" });
    }
});


module.exports = router;