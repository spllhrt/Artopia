const express = require('express');
const router = express.Router();
const upload = require("../utils/multer");

const { getArtworks, getSingleArtwork,
    getAdminArtworks,
    deleteArtwork,
    newArtwork,
    updateArtwork,
    createArtworkReview,
    getArtworkReviews,
    deleteReview,

 } = require('../controllers/artwork');
 const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth');

router.get('/artworks', getArtworks)
router.get('/artwork/:id', getSingleArtwork)
router.get('/admin/artworks', isAuthenticatedUser, authorizeRoles('admin'), getAdminArtworks);
router.put('/admin/artwork/:id', isAuthenticatedUser, authorizeRoles('admin'), upload.array('images', 10), updateArtwork);
router.delete('/admin/artwork/:id', isAuthenticatedUser, authorizeRoles('admin'), deleteArtwork);
router.post('/admin/artwork/new', isAuthenticatedUser, authorizeRoles('admin'), upload.array('images', 10), newArtwork);


router.put('/artwork/review/:artworkId', isAuthenticatedUser, createArtworkReview);
router.get('/artwork/reviews/:artworkId', getArtworkReviews);
router.delete('/review/:reviewId', isAuthenticatedUser, authorizeRoles('admin'), deleteReview);

module.exports = router