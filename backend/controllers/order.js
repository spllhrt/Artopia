const Order = require('../models/order');
const Artwork = require('../models/artwork');
const Artmat = require('../models/artmat');

// Create new order
exports.newOrder = async (req, res) => {
    try {
        const {
            orderItems,
            shippingInfo,
            itemsPrice,
            taxPrice,
            shippingPrice,
            totalPrice,
            paymentInfo
        } = req.body;

        const order = await Order.create({
            orderItems,
            shippingInfo,
            itemsPrice,
            taxPrice,
            shippingPrice,
            totalPrice,
            paymentInfo,
            paidAt: Date.now(),
            user: req.user.id
        });

        return res.status(200).json({
            success: true,
            order
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Get logged in user orders
exports.myOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user.id });
        
        // Always return 200, with empty array if no orders found
        return res.status(200).json({
            success: true,
            orders: orders || [],
            totalAmount: orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0)
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};
// Get single order
exports.getSingleOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('user', 'name email');
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'No order found with this ID'
            });
        }

        return res.status(200).json({
            success: true,
            order
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Get all orders - ADMIN
exports.allOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        const orders = await Order.find()
            .limit(limit)
            .skip(skip)
            .sort({ createdAt: -1 });
        
        const totalCount = await Order.countDocuments();
        const totalAmount = await Order.aggregate([
            { $group: { _id: null, total: { $sum: "$totalPrice" } } }
        ]);
        
        return res.status(200).json({
            success: true,
            totalAmount: totalAmount.length > 0 ? totalAmount[0].total : 0,
            orders,
            pagination: {
                total: totalCount,
                pages: Math.ceil(totalCount / limit),
                page,
                limit
            }
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Delete order - ADMIN
exports.deleteOrder = async (req, res) => {
    try {
        const order = await Order.findByIdAndDelete(req.params.id);
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'No order found with this ID'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Order deleted successfully'
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};
// Update order status and payment info - ADMIN
exports.updateOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'No order found with this ID'
            });
        }

        if (order.orderStatus === 'Delivered') {
            return res.status(400).json({
                success: false,
                message: 'You have already delivered this order'
            });
        }

        let statusChanged = false;
        let newStatus = '';

        // Update payment status if included in request
        if (req.body.paymentStatus) {
            // Update payment info
            order.paymentInfo.status = req.body.paymentStatus;
            
            // If payment is marked as paid, update paidAt timestamp
            if (req.body.paymentStatus === 'paid') {
                order.paidAt = Date.now();
            } else {
                // If payment is changed to not paid, clear the paidAt field
                order.paidAt = null;
            }
        }

        // Update order status if included in request
        if (req.body.status && order.orderStatus !== req.body.status) {
            statusChanged = true;
            newStatus = req.body.status;
            
            // Only proceed with stock updates if order is being confirmed/processed
            if (req.body.status !== 'Cancelled') {
                // Update stock for each item
                for (const item of order.orderItems) {
                    await updateStock(item.product, item.quantity, item.productType);
                }
            }

            order.orderStatus = req.body.status;
            
            if (req.body.status === 'Delivered') {
                order.deliveredAt = Date.now();
                
                // Auto-mark payment as paid when order is delivered
                order.paymentInfo.status = 'paid';
                order.paidAt = Date.now();
            }
        }

        await order.save();

        // Send notification if status changed
        if (statusChanged) {
            try {
                // Generate appropriate message based on status
                let message = '';
                switch (newStatus) {
                    case 'Processing':
                        message = `Your order #${order._id.toString().slice(-6)} is now being processed. We'll update you when it ships!`;
                        break;
                    case 'Shipped':
                        message = `Great news! Your order #${order._id.toString().slice(-6)} has shipped and is on its way to you.`;
                        break;
                    case 'Delivered':
                        message = `Your order #${order._id.toString().slice(-6)} has been delivered. Enjoy your art supplies!`;
                        break;
                    case 'Cancelled':
                        message = `Your order #${order._id.toString().slice(-6)} has been cancelled. Please contact support for more information.`;
                        break;
                    default:
                        message = `Your order #${order._id.toString().slice(-6)} status has been updated to: ${newStatus}`;
                }
                
                // Send notification using the endpoint we created
                await axios.post(`${req.protocol}://${req.get('host')}/api/notify-order-update`, {
                    orderId: order._id,
                    status: newStatus,
                    message: message
                });
                
                console.log('✅ Order update notification sent');
            } catch (notifyError) {
                console.error('❌ Error sending order update notification:', notifyError);
                // Don't fail the entire request if notification fails
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Order updated successfully'
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Helper function to update product stock
async function updateStock(id, quantity, productType) {
    try {
        // Determine which model to use based on productType
        const ProductModel = productType === 'artwork' ? Artwork : Artmat;
        
        const product = await ProductModel.findById(id);
        
        if (!product) {
            throw new Error(`No ${productType} found with this ID`);
        }

        // For artwork, update status to 'sold' when ordered
        if (productType === 'artwork') {
            product.status = 'sold';
        } 
        // For artmat, decrease the stock quantity
        else {
            if (product.stock < quantity) {
                throw new Error('Not enough stock available');
            }
            product.stock = product.stock - quantity;
        }

        await product.save({ validateBeforeSave: false });
    } catch (error) {
        throw error;
    }
}

// Create order from cart items
exports.createOrderFromCart = async (req, res) => {
    try {
        const {
            cartItems,
            shippingInfo,
            paymentInfo
        } = req.body;

        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No items in cart'
            });
        }

        // Format cart items to order items
        const orderItems = cartItems.map(item => {
            const orderItem = {
                productType: item.productType,
                quantity: item.quantity,
                price: item.product.price,
                product: item.product.id
            };

            // Add product-specific fields
            if (item.productType === 'artwork') {
                orderItem.title = item.product.title;
                orderItem.artist = item.product.artist;
                orderItem.medium = item.product.medium;
                orderItem.image = item.product.images && item.product.images.length > 0 ? 
                    item.product.images[0].url : '';
            } else {
                orderItem.name = item.product.name;
                orderItem.image = item.product.images && item.product.images.length > 0 ? 
                    item.product.images[0].url : '';
            }

            return orderItem;
        });

        // Calculate prices
        let itemsPrice = 0;
        orderItems.forEach(item => {
            itemsPrice += item.price * item.quantity;
        });

        const taxRate = 0.10; // 10% tax
        const taxPrice = itemsPrice * taxRate;
        
        // Calculate shipping based on total price
        const shippingPrice = itemsPrice > 100 ? 0 : 15; // Free shipping over $100
        
        const totalPrice = itemsPrice + taxPrice + shippingPrice;

        // Create order
        const order = await Order.create({
            orderItems,
            shippingInfo,
            itemsPrice,
            taxPrice,
            shippingPrice,
            totalPrice,
            paymentInfo,
            paidAt: Date.now(),
            user: req.user.id
        });

        return res.status(200).json({
            success: true,
            order
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};