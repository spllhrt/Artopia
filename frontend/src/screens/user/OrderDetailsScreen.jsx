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
import { AntDesign, MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';

const OrderDetailsScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const route = useRoute();
  const { orderId } = route.params;

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      if (orderId) {
        const orderData = await dispatch(getOrderDetails(orderId));
        setOrder(orderData);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load order details');
      console.error(error);
    } finally {
      setLoading(false);
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
            <Text style={styles.addressName}>
              {shippingInfo.name || 'Recipient'}
            </Text>
            <Text style={styles.addressText}>
              {shippingInfo.address || 'No address provided'}
            </Text>
            <Text style={styles.addressText}>
              {shippingInfo.city || ''}{shippingInfo.city && shippingInfo.postalCode ? ', ' : ''}{shippingInfo.postalCode || ''}
            </Text>
            <Text style={styles.addressText}>
              {shippingInfo.country || ''}
            </Text>
            <View style={styles.phoneRow}>
              <MaterialIcons name="phone" size={16} color="#666" />
              <Text style={styles.phoneText}>
                {shippingInfo.phoneNo || 'Not provided'}
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
    backgroundColor: '#f5f5f7'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3
  },
  backButton: {
    padding: 5
  },
  placeholder: {
    width: 24
  },
  title: { 
    fontSize: 18, 
    fontWeight: 'bold',
    textAlign: 'center'
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  loadingText: { 
    marginTop: 10, 
    fontSize: 16 
  },
  emptyContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20 
  },
  errorText: { 
    fontSize: 18, 
    color: '#666', 
    marginTop: 20, 
    marginBottom: 30, 
    textAlign: 'center' 
  },
  emptyText: { 
    textAlign: 'center', 
    fontSize: 16, 
    color: '#757575', 
    marginVertical: 15 
  },
  statusContainer: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    marginBottom: 10
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 10
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5
  },
  orderId: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 5
  },
  sectionCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    marginHorizontal: 12,
    marginBottom: 10,
    padding: 15,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginVertical: 10
  },
  itemRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemImageContainer: {
    width: 70,
    height: 70,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 15
  },
  itemImage: {
    width: '100%',
    height: '100%'
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center'
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'space-between'
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4
  },
  itemType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4
  },
  itemPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666'
  },
  addressContainer: {
    paddingVertical: 5
  },
  addressName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8
  },
  addressText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10
  },
  phoneText: {
    fontSize: 15,
    color: '#666',
    marginLeft: 8
  },
  paymentStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  paymentLabel: {
    fontSize: 15,
    color: '#666'
  },
  paymentStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12
  },
  paymentStatusText: {
    fontSize: 14,
    fontWeight: '600'
  },
  paymentInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8
  },
  paymentValue: {
    fontSize: 15,
    fontWeight: '500'
  },
  summaryContainer: {
    paddingVertical: 5
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 6
  },
  summaryLabel: {
    fontSize: 15,
    color: '#666'
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '500'
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0066cc',
  },
  buttonContainer: {
    marginHorizontal: 12,
    marginVertical: 20,
  },
  shopButton: {
    backgroundColor: '#0066cc',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
    elevation: 1
  },
  shopButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 5,
    elevation: 1
  },
  buttonIcon: {
    marginRight: 8
  },
  cancelButton: {
    backgroundColor: '#F44336'
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16
  }
});

export default OrderDetailsScreen;