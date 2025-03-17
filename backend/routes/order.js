const express = require('express');
const router = express.Router();

const { 
    newOrder,
    createOrderFromCart, 
    myOrders, 
    getSingleOrder,
    allOrders,
    deleteOrder,
    updateOrder
} = require('../controllers/order');

const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth');

// Customer routes
router.post('/order/new', isAuthenticatedUser, newOrder);
router.post('/order/from-cart', isAuthenticatedUser, createOrderFromCart);
router.get('/orders/me', isAuthenticatedUser, myOrders);
router.get('/order/:id', isAuthenticatedUser, getSingleOrder);

// Allow customers to cancel their orders
router.put('/order/:id/status', isAuthenticatedUser, updateOrder);

// Admin routes
router.get('/admin/orders', isAuthenticatedUser, authorizeRoles('admin'), allOrders);
router.route('/admin/order/:id')
    .put(isAuthenticatedUser, authorizeRoles('admin'), updateOrder)
    .delete(isAuthenticatedUser, authorizeRoles('admin'), deleteOrder);
module.exports = router;