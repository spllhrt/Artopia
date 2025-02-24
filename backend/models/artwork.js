const mongoose = require('mongoose');

const artworkSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please enter artwork name'],
        trim: true,
        maxLength: [100, 'Artwork name cannot exceed 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Please enter artwork description'],
    },
    category: {
        type: String,
        required: [true, 'Please select a category for this artwork'],
    },
    artist: {
        type: String, 
        required: [true, 'Please enter artwork artist']
    },
    medium: {
        type: String,
        required: [true, 'Please enter medium of artwork'],
    },
    images: [
        {
            public_id: {
                type: String,
                required: true
            },
            url: {
                type: String,
                required: true
            }
        }
    ],
    price: {
        type: Number,
        required: [true, 'Please enter artwork price'],
        default: 0.0
    },
    status: {
        type: String,
        enum: ['available', 'sold'],
        default: 'available'
    },
    ratings: {
        type: Number,
        default: 0
    },
    numOfReviews: {
        type: Number,
        default: 0
    },
    reviews: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            name: {
                type: String,
                required: true
            },
            rating: {
                type: Number,
                required: true
            },
            comment: {
                type: String,
                required: true
            }
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Artwork', artworkSchema);
