const express = require("express");
const router = express.Router();
const upload = require("../utils/multer"); // Import multer config
const { registerUser,
    loginUser, 
    logout,
    getUserProfile,
    updateProfile,
    updatePassword,
    allUsers,
    updateUser,
    getUserDetails,
 } = require("../controllers/auth");

const { isAuthenticatedUser,  authorizeRoles } = require('../middlewares/auth');

router.post("/register", upload.single("avatar"), registerUser);
router.get('/me', isAuthenticatedUser, getUserProfile)
router.post('/login', loginUser);
router.put('/me/update', isAuthenticatedUser,  upload.single("avatar"), updateProfile)
router.put('/password/update', isAuthenticatedUser, updatePassword)
router.get('/logout', logout);
router.get('/admin/users', isAuthenticatedUser, authorizeRoles('admin'), allUsers)
router.route('/admin/user/:id').get(isAuthenticatedUser,  getUserDetails)
// This is how it should be set up
router.put(
    '/admin/user/:id',
    isAuthenticatedUser,  // Verify the admin's token
    authorizeRoles('admin'),  // Verify they have admin role
    updateUser  // Allow them to update the user
  );

module.exports = router;
