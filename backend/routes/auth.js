const express = require("express");
const router = express.Router();
const upload = require("../utils/multer"); // Import multer config
const { registerUser,
    loginUser, 
    logout,
    getUserProfile,
    updateProfile,
    updatePassword,
 } = require("../controllers/auth");

const { isAuthenticatedUser,  authorizeRoles } = require('../middlewares/auth');

router.post("/register", upload.single("avatar"), registerUser);
router.get('/me', isAuthenticatedUser, getUserProfile)
router.post('/login', loginUser);
router.put('/me/update', isAuthenticatedUser,  upload.single("avatar"), updateProfile)
router.put('/password/update', isAuthenticatedUser, updatePassword)
router.get('/logout', logout);
module.exports = router;
