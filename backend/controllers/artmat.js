const Artmat = require('../models/artmat')
// const Order = require('../models/order');
const APIFeatures = require('../utils/apiFeatures');
const cloudinary = require("cloudinary").v2;

exports.getArtmats = async (req, res, next) => {
    
//     const resPerPage = 4;
//     const artmatsCount = await Artmat.countDocuments();
//     const apiFeatures = new APIFeatures(Artmat.find(), req.query).search().filter();
//     apiFeatures.pagination(resPerPage);
//     const artmats = await apiFeatures.query;
//     let filteredArtmatsCount = artmats.length;

//     if (!artmats) 
//         return res.status(400).json({message: 'error loading Artmats'})
//    return res.status(200).json({
//         success: true,
//         artmats,
//         filteredArtmatsCount,
//         resPerPage,
//         artmatsCount,
        
//     })

        const artmats = await Artmat.find();
            if (!artmats) {
                return res.status(404).json({
                    success: false,
                    message: 'Artmat not found'
                })
            }
            return res.status(200).json({
                success: true,
                artmats
            })
}

exports.getSingleArtmat = async (req, res, next) => {
    const artmat = await Artmat.findById(req.params.id);
    if (!artmat) {
        return res.status(404).json({
            success: false,
            message: 'Artmat not found'
        })
    }
    return res.status(200).json({
        success: true,
        artmat
    })
}

exports.getAdminArtmats = async (req, res, next) => {

    const artmats = await Artmat.find();
    if (!artmats) {
        return res.status(404).json({
            success: false,
            message: 'Artmat not found'
        })
    }
    return res.status(200).json({
        success: true,
        artmats
    })

}

exports.deleteArtmat = async (req, res, next) => {
    const artmat = await Artmat.findByIdAndDelete(req.params.id);
    if (!artmat) {
        return res.status(404).json({
            success: false,
            message: 'Artmat not found'
        })
    }

    return res.status(200).json({
        success: true,
        message: 'Artmat deleted'
    })
}

exports.newArtmat = async (req, res) => {
    try {

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, message: "No images uploaded." });
        }

        let imagesLinks = [];

        for (const file of req.files) {

            try {
                const result = await cloudinary.uploader.upload_stream(
                    { folder: "artmats", width: 500, crop: "scale" },
                    (error, result) => {
                        if (error) {
                            console.error("Cloudinary Upload Error:", error);
                            return res.status(500).json({ success: false, message: "Error uploading images to Cloudinary." });
                        }
                        imagesLinks.push({ public_id: result.public_id, url: result.secure_url });

                        if (imagesLinks.length === req.files.length) {
                            req.body.images = imagesLinks;
                            req.body.user = req.user.id;

                            Artmat.create(req.body)
                                .then((artmat) => res.status(201).json({ success: true, artmat }))
                                .catch((err) => res.status(400).json({ success: false, message: "Artmat not created." }));
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


exports.updateArtmat = async (req, res, next) => {
    let artmat = await Artmat.findById(req.params.id);

    if (!artmat) {
        return res.status(404).json({
            success: false,
            message: 'Artmat not found'
        });
    }

    if (req.files && req.files.length > 0) {
        for (let i = 0; i < artmat.images.length; i++) {
            await cloudinary.uploader.destroy(artmat.images[i].public_id);
        }

        let imagesLinks = [];

        for (const file of req.files) {
            try {
                const result = await new Promise((resolve, reject) => {
                    const uploadStream = cloudinary.uploader.upload_stream(
                        { folder: 'artmats', width: 500, crop: 'scale' },
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
        req.body.images = artmat.images;
    }

    artmat = await Artmat.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
        useFindAndModify: false
    });

    return res.status(200).json({
        success: true,
        artmat
    });
};

exports.createArtmatReview = async (req, res, next) => {
    try {
        const { rating, comment } = req.body;
        const { artmatId } = req.params;  // Get artmat ID from URL params

        if (!artmatId) {
            return res.status(400).json({ success: false, message: "Artmat ID is required." });
        }

        const artmat = await Artmat.findById(artmatId);

        if (!artmat) {
            return res.status(404).json({ success: false, message: "Artmat not found." });
        }

        const review = {
            user: req.user._id,
            name: req.user.name,
            rating: Number(rating),
            comment
        };

        const isReviewed = artmat.reviews.find(r => r.user.toString() === req.user._id.toString());

        if (isReviewed) {
            artmat.reviews.forEach(review => {
                if (review.user.toString() === req.user._id.toString()) {
                    review.comment = comment;
                    review.rating = rating;
                }
            });
        } else {
            artmat.reviews.push(review);
            artmat.numOfReviews = artmat.reviews.length;
        }

        artmat.ratings = artmat.reviews.reduce((acc, item) => item.rating + acc, 0) / artmat.reviews.length;

        await artmat.save({ validateBeforeSave: false });

        return res.status(200).json({ success: true, message: "Review added/updated successfully!" });

    } catch (error) {
        console.error("Error in createArtmatReview:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error." });
    }
};

exports.getArtmatReviews = async (req, res, next) => {
    try {
        const { artmatId } = req.params;  // Get artmat ID from URL params

        if (!artmatId) {
            return res.status(400).json({ success: false, message: "Artmat ID is required." });
        }

        const artmat = await Artmat.findById(aartmatId);

        if (!artmat) {
            return res.status(404).json({ success: false, message: "Artmat not found." });
        }

        return res.status(200).json({
            success: true,
            reviews: artmat.reviews
        });

    } catch (error) {
        console.error("Error in getArtmatReviews:", error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};
exports.deleteReview = async (req, res, next) => {
    try {
        const { reviewId } = req.params; 

        if (!reviewId) {
            return res.status(400).json({ success: false, message: "Review ID is required." });
        }

        const artmat = await Artmat.findOne({ "reviews._id": reviewId });

        if (!artmat) {
            return res.status(404).json({ success: false, message: "Review not found." });
        }

        artmat.reviews = artmat.reviews.filter(review => review._id.toString() !== reviewId);
        artmat.numOfReviews = artmat.reviews.length;
        artartmatwork.ratings = artmat.reviews.length > 0 
            ? artmat.reviews.reduce((acc, item) => item.rating + acc, 0) / artmat.reviews.length 
            : 0;

        await artmat.save({ validateBeforeSave: false });

        return res.status(200).json({ success: true, message: "Review deleted successfully!" });

    } catch (error) {
        console.error("Error in deleteReview:", error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};


// exports.artmatSales = async (req, res, next) => {
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
//                 _id: { artmat: "$orderItems.name" },
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
//             name: item._id.artmat,
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