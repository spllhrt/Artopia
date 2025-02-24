const Artwork = require('../models/artwork')
// const Order = require('../models/order');
const APIFeatures = require('../utils/apiFeatures');
const cloudinary = require("cloudinary").v2;

exports.getArtworks = async (req, res) => {
    
	const resPerPage = 4;
    const artworksCount = await Artwork.countDocuments();
	const apiFeatures = new APIFeatures(Artwork.find(), req.query).search().filter();
	apiFeatures.pagination(resPerPage);
	const artworks = await apiFeatures.query;
	let filteredArtworksCount = artworks.length;

	if (!artworks) 
        return res.status(400).json({message: 'error loading Artworks'})
   return res.status(200).json({
        success: true,
        artworks,
		filteredArtworksCount,
		resPerPage,
		artworksCount,
		
	})
}

exports.getSingleArtwork = async (req, res, next) => {
	const artwork = await Artwork.findById(req.params.id);
	if (!artwork) {
		return res.status(404).json({
			success: false,
			message: 'Artwork not found'
		})
	}
	return res.status(200).json({
		success: true,
		artwork
	})
}

exports.getAdminArtworks = async (req, res, next) => {

	const artworks = await Artwork.find();
	if (!artworks) {
		return res.status(404).json({
			success: false,
			message: 'Artwork not found'
		})
	}
	return res.status(200).json({
		success: true,
		artworks
	})

}

exports.deleteArtwork = async (req, res, next) => {
	const artwork = await Artwork.findByIdAndDelete(req.params.id);
	if (!artwork) {
		return res.status(404).json({
			success: false,
			message: 'Artwork not found'
		})
	}

	return res.status(200).json({
		success: true,
		message: 'Artwork deleted'
	})
}

exports.newArtwork = async (req, res) => {
    try {

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, message: "No images uploaded." });
        }

        let imagesLinks = [];

        for (const file of req.files) {

            try {
                const result = await cloudinary.uploader.upload_stream(
                    { folder: "artworks", width: 500, crop: "scale" },
                    (error, result) => {
                        if (error) {
                            console.error("Cloudinary Upload Error:", error);
                            return res.status(500).json({ success: false, message: "Error uploading images to Cloudinary." });
                        }
                        imagesLinks.push({ public_id: result.public_id, url: result.secure_url });

                        if (imagesLinks.length === req.files.length) {
                            req.body.images = imagesLinks;
                            req.body.user = req.user.id;

                            Artwork.create(req.body)
                                .then((artwork) => res.status(201).json({ success: true, artwork }))
                                .catch((err) => res.status(400).json({ success: false, message: "Artwork not created." }));
                        }
                    }
                ).end(file.buffer); 

            } catch (error) {
                console.error("Cloudinary Upload Error:", error);
                return res.status(500).json({ success: false, message: "Error uploading images to Cloudinary." });
            }
        }

    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error." });
    }
};


exports.updateArtwork = async (req, res, next) => {
    let artwork = await Artwork.findById(req.params.id);

    if (!artwork) {
        return res.status(404).json({
            success: false,
            message: 'Artwork not found'
        });
    }

    if (req.files && req.files.length > 0) {
        for (let i = 0; i < artwork.images.length; i++) {
            await cloudinary.uploader.destroy(artwork.images[i].public_id);
        }

        let imagesLinks = [];

        for (const file of req.files) {
            try {
                const result = await new Promise((resolve, reject) => {
                    const uploadStream = cloudinary.uploader.upload_stream(
                        { folder: 'artworks', width: 500, crop: 'scale' },
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result);
                        }
                    );
                    uploadStream.end(file.buffer);
                });

                imagesLinks.push({
                    public_id: result.public_id,
                    url: result.secure_url
                });

            } catch (error) {
                console.error("Cloudinary Upload Error:", error);
                return res.status(500).json({ success: false, message: "Error uploading images to Cloudinary." });
            }
        }

        req.body.images = imagesLinks; 
    } else {
        req.body.images = artwork.images;
    }

    artwork = await Artwork.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
        useFindAndModify: false
    });

    return res.status(200).json({
        success: true,
        artwork
    });
};

exports.createArtworkReview = async (req, res, next) => {
    try {
        const { rating, comment } = req.body;
        const { artworkId } = req.params;  // Get artwork ID from URL params

        if (!artworkId) {
            return res.status(400).json({ success: false, message: "Artwork ID is required." });
        }

        const artwork = await Artwork.findById(artworkId);

        if (!artwork) {
            return res.status(404).json({ success: false, message: "Artwork not found." });
        }

        const review = {
            user: req.user._id,
            name: req.user.name,
            rating: Number(rating),
            comment
        };

        const isReviewed = artwork.reviews.find(r => r.user.toString() === req.user._id.toString());

        if (isReviewed) {
            artwork.reviews.forEach(review => {
                if (review.user.toString() === req.user._id.toString()) {
                    review.comment = comment;
                    review.rating = rating;
                }
            });
        } else {
            artwork.reviews.push(review);
            artwork.numOfReviews = artwork.reviews.length;
        }

        artwork.ratings = artwork.reviews.reduce((acc, item) => item.rating + acc, 0) / artwork.reviews.length;

        await artwork.save({ validateBeforeSave: false });

        return res.status(200).json({ success: true, message: "Review added/updated successfully!" });

    } catch (error) {
        console.error("Error in createArtworkReview:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error." });
    }
};

exports.getArtworkReviews = async (req, res, next) => {
    try {
        const { artworkId } = req.params;  // Get artwork ID from URL params

        if (!artworkId) {
            return res.status(400).json({ success: false, message: "Artwork ID is required." });
        }

        const artwork = await Artwork.findById(artworkId);

        if (!artwork) {
            return res.status(404).json({ success: false, message: "Artwork not found." });
        }

        return res.status(200).json({
            success: true,
            reviews: artwork.reviews
        });

    } catch (error) {
        console.error("Error in getArtworkReviews:", error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};
exports.deleteReview = async (req, res, next) => {
    try {
        const { reviewId } = req.params; 

        if (!reviewId) {
            return res.status(400).json({ success: false, message: "Review ID is required." });
        }

        const artwork = await Artwork.findOne({ "reviews._id": reviewId });

        if (!artwork) {
            return res.status(404).json({ success: false, message: "Review not found." });
        }

        artwork.reviews = artwork.reviews.filter(review => review._id.toString() !== reviewId);
        artwork.numOfReviews = artwork.reviews.length;
        artwork.ratings = artwork.reviews.length > 0 
            ? artwork.reviews.reduce((acc, item) => item.rating + acc, 0) / artwork.reviews.length 
            : 0;

        await artwork.save({ validateBeforeSave: false });

        return res.status(200).json({ success: true, message: "Review deleted successfully!" });

    } catch (error) {
        console.error("Error in deleteReview:", error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};


// exports.artworkSales = async (req, res, next) => {
//     const totalSales = await Order.aggregate([
//         {
//             $group: {
//                 _id: null,
//                 total: { $sum: "$itemsPrice" }

//             },
            
//         },
//     ])
//     console.log(totalSales)
//     const sales = await Order.aggregate([
//         { $project: { _id: 0, "orderItems": 1, totalPrice: 1 } },
//         { $unwind: "$orderItems" },
		
//         {
//             $group: {
//                 _id: { artwork: "$orderItems.name" },
//                 total: { $sum: { $multiply: ["$orderItems.price", "$orderItems.quantity"] } }
//             },
//         },
//     ])
	
// 	// return console.log(sales)
    
//     if (!totalSales) {
// 		return res.status(404).json({
// 			message: 'error sales'
// 		})
       
//     }
//     if (!sales) {
// 		return res.status(404).json({
// 			message: 'error sales'
// 		})
      
//     }
    
//     let totalPercentage = {}
//     totalPercentage = sales.map(item => {
         
//         // console.log( ((item.total/totalSales[0].total) * 100).toFixed(2))
//         percent = Number (((item.total/totalSales[0].total) * 100).toFixed(2))
//         total =  {
//             name: item._id.artwork,
//             percent
//         }
//         return total
//     }) 
//     // return console.log(totalPercentage)
//     return res.status(200).json({
//         success: true,
//         totalPercentage,
//         sales,
//         totalSales
//     })

// }