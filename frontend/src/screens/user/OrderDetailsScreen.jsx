import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator, 
  SafeAreaView,
  Image
} from 'react-native';
import { useDispatch } from 'react-redux';
import { useRoute, useNavigation } from '@react-navigation/native';
import { getOrderDetails, updateOrder } from '../../api/orderApi';
import { getUserDetails } from '../../api/authApi';
import { AntDesign, MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';

const OrderDetailsScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const route = useRoute();
  const { orderId } = route.params;
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [loadingUser, setLoadingUser] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      if (orderId) {
        const orderData = await dispatch(getOrderDetails(orderId));
        setOrder(orderData);
        
        // If order contains user information, fetch user details
        if (orderData && (orderData.user || orderData.user?._id)) {
          fetchUserDetails(orderData.user?._id || orderData.user);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load order details');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch user details with error handling
  const fetchUserDetails = async (userId) => {
    if (!userId) return;
    
    setLoadingUser(true);
    try {
      const response = await getUserDetails(userId);
      
      if (response && response.user) {
        setUserData(response.user);
      }
    } catch (error) {
      console.error("Failed to fetch user details:", error);
    } finally {
      setLoadingUser(false);
    }
  };

  const handleCancelOrder = async () => {
    try {
      setCancelLoading(true);
      await dispatch(updateOrder(orderId, { status: 'Cancelled' }));
      Alert.alert('Success', 'Your order has been cancelled');
      fetchOrderDetails();
    } catch (error) {
      Alert.alert('Error', 'Failed to cancel order');
      console.error(error);
    } finally {
      setCancelLoading(false);
    }
  };

  const getOrderStatusColor = (status) => {
    const colors = {
      'Processing': '#FF9800',
      'Shipped': '#2196F3',
      'Delivered': '#4CAF50',
      'Cancelled': '#F44336'
    };
    return colors[status] || '#607D8B';
  };

  const getOrderStatusIcon = (status) => {
    const icons = {
      'Processing': <MaterialIcons name="pending" size={16} color="#FFF" />,
      'Shipped': <FontAwesome5 name="shipping-fast" size={16} color="#FFF" />,
      'Delivered': <Ionicons name="checkmark-circle" size={16} color="#FFF" />,
      'Cancelled': <AntDesign name="close" size={16} color="#FFF" />
    };
    return icons[status] || <MaterialIcons name="help" size={16} color="#FFF" />;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  // Helper function to get user name
  const getUserName = () => {
    if (userData && userData.name) {
      return userData.name;
    }
    
    // Fallback to order.user if available
    if (order && order.user && order.user.name) {
      return order.user.name;
    }
    
    return 'Unknown';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <AntDesign name="fileexclamation" size={64} color="#ccc" />
          <Text style={styles.errorText}>Order not found</Text>
          <TouchableOpacity 
            style={styles.shopButton} 
            onPress={() => navigation.navigate('Shop', { 
              screen: 'Shop', 
              params: { 
                screen: 'ShopMain' 
              }
            })}
          >
            <Text style={styles.shopButtonText}>Go to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Safely extract values from order using the correct model property names
  const { 
    orderItems = [], 
    shippingInfo = {}, 
    paymentInfo = {}, 
    orderStatus = 'Processing',
    createdAt,
    itemsPrice = 0,
    taxPrice = 0,
    shippingPrice = 0,
    totalPrice = 0,
    _id
  } = order;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <AntDesign name="arrowleft" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Order Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Order Status Progress */}
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getOrderStatusColor(orderStatus) }]}>
            {getOrderStatusIcon(orderStatus)}
            <Text style={styles.statusText}>{orderStatus}</Text>
          </View>
          <Text style={styles.orderId}>Order #{_id?.slice(-8) || 'Unknown'}</Text>
          <Text style={styles.orderDate}>Placed on {formatDate(createdAt)}</Text>
        </View>

        {/* Customer Information */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="person" size={20} color="#0066cc" />
            <Text style={styles.sectionTitle}>Customer Information</Text>
          </View>
          
          {loadingUser ? (
            <View style={styles.loadingUserContainer}>
              <ActivityIndicator size="small" color="#0066cc" />
              <Text style={styles.loadingText}>Loading customer details...</Text>
            </View>
          ) : (
            <View style={styles.customerInfoContainer}>
              <View style={styles.infoRow}>
                <MaterialIcons name="person-outline" size={16} color="#666" />
                <Text style={styles.infoLabel}>Name:</Text>
                <Text style={styles.infoValue}>{getUserName()}</Text>
              </View>
              
              {userData && userData.email && (
                <View style={styles.infoRow}>
                  <MaterialIcons name="email" size={16} color="#666" />
                  <Text style={styles.infoLabel}>Email:</Text>
                  <Text style={styles.infoValue}>{userData.email}</Text>
                </View>
              )}
              
              {userData && userData.phone && (
                <View style={styles.infoRow}>
                  <MaterialIcons name="phone" size={16} color="#666" />
                  <Text style={styles.infoLabel}>Phone:</Text>
                  <Text style={styles.infoValue}>{userData.phone}</Text>
                </View>
              )}
            </View>
          )}
        </View>
        
        {/* Order Items */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="shopping-bag" size={20} color="#0066cc" />
            <Text style={styles.sectionTitle}>Order Items</Text>
          </View>
          
          {orderItems.length === 0 ? (
            <Text style={styles.emptyText}>No items in this order</Text>
          ) : (
            orderItems.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <View style={styles.itemImageContainer}>
                  {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.itemImage} />
                  ) : (
                    <View style={styles.placeholderImage}>
                      <AntDesign name="picture" size={20} color="#ccc" />
                    </View>
                  )}
                </View>
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName}>
                    {item.productType === 'artwork' ? item.title : item.name || `Item #${index + 1}`}
                  </Text>
                  <Text style={styles.itemType}>
                    {item.productType === 'artwork' ? 'Artwork' : 'Art Material'}
                    {item.productType === 'artwork' && item.artist && ` by ${item.artist}`}
                  </Text>
                  <View style={styles.itemPriceRow}>
                    <Text style={styles.itemPrice}>
                      ${(item.price || 0).toFixed(2)}
                    </Text>
                    <Text style={styles.itemQuantity}>
                      Qty: {item.quantity || 1}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
          
        {/* Shipping Information */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="local-shipping" size={20} color="#0066cc" />
            <Text style={styles.sectionTitle}>Shipping Information</Text>
          </View>
          
          <View style={styles.addressContainer}>
            <Text style={styles.addressName}>Recipient: 
            {" " + getUserName()}
            </Text>
            <Text style={styles.addressText}>Street: 
              {" " + shippingInfo.address || 'No address provided'}
            </Text>
            <Text style={styles.addressText}>City: 
              {" " + shippingInfo.city || ''}{shippingInfo.city && shippingInfo.postalCode ? ', ' : ''}{shippingInfo.postalCode || ''}
            </Text>
            <Text style={styles.addressText}>Country: 
              {" " + shippingInfo.country || ''}
            </Text>
            <View style={styles.phoneRow}>
              <MaterialIcons name="phone" size={16} color="#666" />
              <Text style={styles.phoneText}>Phone: 
                {" " + shippingInfo.phoneNo || 'Not provided'}
              </Text>
            </View>
          </View>
        </View>
          
        {/* Payment Information */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="payment" size={20} color="#0066cc" />
            <Text style={styles.sectionTitle}>Payment Information</Text>
          </View>
          
          <View style={styles.paymentStatusContainer}>
            <Text style={styles.paymentLabel}>Payment Status:</Text>
            <View style={[
              styles.paymentStatusBadge, 
              { backgroundColor: paymentInfo.status === 'paid' ? '#E8F5E9' : '#FFEBEE' }
            ]}>
              <Text style={[
                styles.paymentStatusText, 
                { color: paymentInfo.status === 'paid' ? '#4CAF50' : '#F44336' }
              ]}>
                {paymentInfo.status === 'paid' ? 'Paid' : 'Pending'}
              </Text>
            </View>
          </View>
          
          {paymentInfo.id && (
            <View style={styles.paymentInfoRow}>
              <Text style={styles.paymentLabel}>Transaction ID:</Text>
              <Text style={styles.paymentValue}>{paymentInfo.id}</Text>
            </View>
          )}
        </View>
          
        {/* Order Summary */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="receipt" size={20} color="#0066cc" />
            <Text style={styles.sectionTitle}>Order Summary</Text>
          </View>
          
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Items Total:</Text>
              <Text style={styles.summaryValue}>${itemsPrice.toFixed(2)}</Text>
            </View>
            
            {taxPrice > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tax:</Text>
                <Text style={styles.summaryValue}>${taxPrice.toFixed(2)}</Text>
              </View>
            )}
            
            {shippingPrice > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Shipping:</Text>
                <Text style={styles.summaryValue}>${shippingPrice.toFixed(2)}</Text>
              </View>
            )}
            
            <View style={styles.divider} />
            
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalAmount}>${totalPrice.toFixed(2)}</Text>
            </View>
          </View>
        </View>
        
        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.shopButton} 
            onPress={() => navigation.navigate('Shop', { 
              screen: 'Shop', 
              params: { 
                screen: 'ShopMain' 
              }
            })}
          >
            <Text style={styles.shopButtonText}>Continue Shopping</Text>
          </TouchableOpacity>
          
          {orderStatus !== 'Delivered' && orderStatus !== 'Cancelled' && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => {
                if (!cancelLoading) {
                  Alert.alert(
                    'Cancel Order',
                    'Are you sure you want to cancel this order?',
                    [
                      { text: 'No', style: 'cancel' },
                      { text: 'Yes', onPress: handleCancelOrder }
                    ]
                  );
                }
              }}
              disabled={cancelLoading}
            >
              {cancelLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <AntDesign name="close" size={16} color="#FFFFFF" style={styles.buttonIcon} />
                  <Text style={styles.actionButtonText}>Cancel Order</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  placeholder: {
    width: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#6B7280',
  },
  loadingUserContainer: {
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#4B5563',
    marginVertical: 15,
  },
  statusContainer: {
    padding: 15,
    backgroundColor: '#FFFFFF',
    marginVertical: 10,
    marginHorizontal: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginBottom: 10,
  },
  statusText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 5,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 5,
  },
  orderDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 15,
    marginVertical: 8,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  customerInfoContainer: {
    padding: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    marginRight: 5,
  },
  infoValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
    flex: 1,
  },
  itemRow: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  itemImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  itemType: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 6,
  },
  itemPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  itemQuantity: {
    fontSize: 13,
    color: '#6B7280',
  },
  addressContainer: {
    padding: 15,
  },
  addressName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  addressText: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 4,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  phoneText: {
    fontSize: 14,
    color: '#4B5563',
    marginLeft: 8,
  },
  paymentStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  paymentLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 10,
  },
  paymentValue: {
    fontSize: 14,
    color: '#111827',
    flex: 1,
  },
  paymentStatusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  paymentStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  paymentInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  summaryContainer: {
    padding: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0066cc',
  },
  buttonContainer: {
    padding: 15,
    marginBottom: 20,
  },
  shopButton: {
    backgroundColor: '#0066cc',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  shopButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#DC2626',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: 8,
  },
  emptyText: {
    textAlign: 'center',
    padding: 15,
    color: '#6B7280',
    fontStyle: 'italic',
  },
});

export default OrderDetailsScreen;