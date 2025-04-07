const express = require('express');
const router = express.Router();
const upload = require("../utils/multer");

const { getArtmats, getSingleArtmat,
    getAdminArtmats,
    deleteArtmat,
    newArtmat,
    updateArtmat,
    createArtmatReview,
    getArtmatReviews,
    deleteReview,
    deleteArtmatReview

 } = require('../controllers/artmat');
 const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth');

router.get('/artmats', getArtmats)
router.get('/artmat/:id', getSingleArtmat)
router.get('/admin/artmats', isAuthenticatedUser, authorizeRoles('admin'), getAdminArtmats);
router.put('/admin/artmat/:id', isAuthenticatedUser, authorizeRoles('admin'), upload.array('images', 10), updateArtmat);
router.delete('/admin/artmat/:id', isAuthenticatedUser, authorizeRoles('admin'), deleteArtmat);
router.post('/admin/artmat/new', isAuthenticatedUser, authorizeRoles('admin'), upload.array('images', 10), newArtmat);


router.put('/artmat/review/:artmatId', isAuthenticatedUser, createArtmatReview);
router.get('/artmat/reviews/:artmatId', getArtmatReviews);
router.delete('/review/:reviewId', isAuthenticatedUser, deleteReview);
router.delete('/artmat/review/:itemId/:reviewId', isAuthenticatedUser, deleteArtmatReview);

module.exports = router