const mongoose = require('mongoose');

const artmatSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter material name'],
        trim: true,
        maxLength: [100, 'Artwork name cannot exceed 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Please enter material description'],
    },
    category: {
        type: String,
        required: [true, 'Please select a category for this material'],
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
        required: [true, 'Please enter material price'],
        default: 0.0
    },
    stock: {
        type: Number,
        required: [true, 'Please enter Material stock'],
        maxLength: [5, 'Product name cannot exceed 5 characters'],
        default: 0
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

module.exports = mongoose.model('Artmat', artmatSchema);
