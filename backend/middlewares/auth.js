const User = require('../models/user')
const jwt = require("jsonwebtoken")

exports.isAuthenticatedUser = async (req, res, next) => {
    // Check if token is sent in the Authorization header
    const token = req.header('Authorization') ? req.header('Authorization').split(' ')[1] : null;

    // console.log('Received token:', token); // Log the token to see what is received

    if (!token) {
        return res.status(401).json({ message: 'Login first to access this resource' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify the token
        req.user = await User.findById(decoded.id); // Get user from the decoded token
        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

exports.authorizeRoles = (...roles) => {

    return (req, res, next) => {
        // console.log(roles, req.user, req.body);
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: `Role (${req.user.role}) is not allowed to acccess this resource` })

        }
        next()
    }
}