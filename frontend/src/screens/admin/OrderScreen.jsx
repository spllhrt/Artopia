import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator, 
  Alert, 
  Modal, 
  ScrollView,
  Image
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { getAllOrders, updateOrder, deleteOrder, clearOrderErrors } from '../../api/orderApi';
import { updateOrderReset, deleteOrderReset } from '../../redux/orderSlice';
import { getUserDetails } from '../../api/authApi';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { sendOrderUpdateNotification } from '../../api/notificationApi'; 

const AdminOrderScreen = () => {
  const dispatch = useDispatch();
  const orderState = useSelector(state => state.orders) || {};
  const { orders = [], loading = false, error = null, isUpdated = false, isDeleted = false, totalAmount = 0 } = orderState;
  
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [userData, setUserData] = useState({});
  const [loadingUser, setLoadingUser] = useState(false);

  // Updated function to fetch user details with better error handling
  const fetchUserDetails = async (userId) => {
    if (!userId) return;
    
    // Prevent duplicate fetches
    if (userData[userId] && userData[userId].name) return;
    
    setLoadingUser(true);
    try {
      const response = await getUserDetails(userId);
      
      if (response && response.user) {
        setUserData(prev => ({
          ...prev,
          [userId]: response.user
        }));
      }
    } catch (error) {
      console.error("Failed to fetch user details:", error);
    } finally {
      setLoadingUser(false);
    }
  };

// Updated loadOrders function inside useEffect
useEffect(() => {
  // Set loading state while fetching orders
  const loadOrders = async () => {
    try {
      const response = await dispatch(getAllOrders());
      
      // Check if the response payload contains orders before processing
      if (response && response.payload && response.payload.orders && response.payload.orders.length > 0) {
        const orderData = response.payload.orders;
        
        // Batch fetch user details
        const userIds = [...new Set(
          orderData.map(order => order.user?._id || order.user)
          .filter(id => id && typeof id === 'string')
        )];
        
        // Fetch all user data at once in a batch if possible
        // Or use Promise.all to fetch multiple users in parallel
        Promise.all(userIds.map(userId => fetchUserDetails(userId)))
          .catch(err => console.error("Error fetching user details:", err));
      }
    } catch (err) {
      console.error("Error loading orders:", err);
      Alert.alert('Error', 'Failed to load orders. Please try again later.');
    }
  };
  
  // Load orders when component mounts
  loadOrders();
  
  // Handle order status changes
  if (error) {
    Alert.alert('Error', error);
    dispatch(clearOrderErrors());
  }
  if (isUpdated) {
    Alert.alert('Success', 'Order updated successfully');
    dispatch(updateOrderReset());
    // Reload orders after update
    loadOrders();
  }
  if (isDeleted) {
    Alert.alert('Success', 'Order deleted successfully');
    dispatch(deleteOrderReset());
    // Reload orders after deletion
    loadOrders();
  }
}, [dispatch, error, isUpdated, isDeleted]);

  // Fetch user details when a specific order is selected
  useEffect(() => {
    if (selectedOrder) {
      // Handle different possible user reference structures
      const userId = selectedOrder.user?._id || selectedOrder.user;
      if (userId && typeof userId === 'string') {
        fetchUserDetails(userId);
      }
    }
  }, [selectedOrder]);

  const handleStatusChange = (orderId, newStatus) => {
    dispatch(updateOrder(orderId, { status: newStatus, isAdmin: true }));
    
    // Send notification about order status change
    sendOrderUpdateNotification(
      orderId,
      newStatus,
      `Your order #${orderId.substring(0, 8)} has been updated to ${newStatus}`
    ).catch(error => {
      console.error('❌ Failed to send order notification:', error);
    });
  };

  const handleDeleteOrder = () => {
    if (orderToDelete) {
      dispatch(deleteOrder(orderToDelete));
      setShowConfirmDelete(false);
      setOrderToDelete(null);
    }
  };

  // Helper function to get user name from order
  const getUserName = (order) => {
    if (!order || !order.user) return 'Unknown';
    
    // Handle different possible user reference structures
    const userId = order.user._id || order.user;
    
    if (typeof userId === 'string' && userData[userId]) {
      return userData[userId].name || 'Unknown';
    }
    
    // Fallback to user object if available
    if (order.user.name) {
      return order.user.name;
    }
    
    return 'Unknown';
  };

  // Filter and sort the orders
  const filteredOrders = orders.filter(order => 
    statusFilter === 'all' ? true : order.orderStatus === statusFilter
  );

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
    if (sortBy === 'highValue') return b.totalPrice - a.totalPrice;
    if (sortBy === 'lowValue') return a.totalPrice - b.totalPrice;
    return 0;
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading orders...</Text>
      </View>
    );
  }

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Delivered': return 'checkmark-circle';
      case 'Shipped': return 'bicycle';
      case 'Processing': return 'time';
      case 'Cancelled': return 'close-circle';
      default: return 'help-circle';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Order Management</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={() => dispatch(getAllOrders())}>
          <Ionicons name="refresh" size={20} color="#4F46E5" />
        </TouchableOpacity>
      </View>
      
      {/* Filters */}
      <View style={styles.filtersContainer}>
        <View style={styles.filterItem}>
          <Text style={styles.filterLabel}>Status</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={statusFilter}
              style={styles.picker}
              onValueChange={(value) => setStatusFilter(value)}
            >
              <Picker.Item label="All Orders" value="all" />
              <Picker.Item label="Processing" value="Processing" />
              <Picker.Item label="Shipped" value="Shipped" />
              <Picker.Item label="Delivered" value="Delivered" />
              <Picker.Item label="Cancelled" value="Cancelled" />
            </Picker>
          </View>
        </View>
        
        <View style={styles.filterItem}>
          <Text style={styles.filterLabel}>Sort By</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={sortBy}
              style={styles.picker}
              onValueChange={(value) => setSortBy(value)}
            >
              <Picker.Item label="Newest First" value="newest" />
              <Picker.Item label="Oldest First" value="oldest" />
              <Picker.Item label="Highest Value" value="highValue" />
              <Picker.Item label="Lowest Value" value="lowValue" />
            </Picker>
          </View>
        </View>
      </View>
      
      {/* Orders List */}
      <FlatList
        data={sortedOrders}
        keyExtractor={(item) => item._id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyList}>
            <Ionicons name="cart-outline" size={50} color="#D1D5DB" />
            <Text style={styles.emptyText}>No orders found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
          </View>
        }
        renderItem={({ item: order }) => (
          <TouchableOpacity 
            style={styles.orderItem}
            onPress={() => setSelectedOrder(order)}
          >
            <View style={styles.orderHeader}>
              <View style={styles.orderIdContainer}>
                <Ionicons 
                  name={getStatusIcon(order.orderStatus)} 
                  size={16} 
                  color={getStatusColor(order.orderStatus)} 
                  style={styles.statusIcon}
                />
                <Text style={styles.orderId}>#{order._id.substring(0, 8)}</Text>
              </View>
              <StatusBadge status={order.orderStatus} />
            </View>
            
            <View style={styles.orderDetails}>
              <View style={styles.detailRow}>
                <Ionicons name="person" size={14} color="#6B7280" />
                <Text style={styles.detailText}>
                  {getUserName(order)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="calendar" size={14} color="#6B7280" />
                <Text style={styles.detailText}>{new Date(order.createdAt).toLocaleDateString()}</Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="pricetag" size={14} color="#6B7280" />
                <Text style={styles.orderPrice}>₱{order.totalPrice?.toFixed(2)}</Text>
              </View>
            </View>
            
            <View style={styles.orderActions}>
              <View style={styles.buttonSpacer} />
              <TouchableOpacity 
                onPress={(e) => {
                  e.stopPropagation();
                  setOrderToDelete(order._id);
                  setShowConfirmDelete(true);
                }}
                style={styles.deleteButton}
              >
                <Ionicons name="trash" size={16} color="#DC2626" />
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />
      
      {/* Delete Confirmation Modal */}
      <Modal visible={showConfirmDelete} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <View style={styles.warningIconCircle}>
                <Ionicons name="warning" size={30} color="#DC2626" />
              </View>
            </View>
            <Text style={styles.modalTitle}>Confirm Delete</Text>
            <Text style={styles.modalText}>Are you sure you want to delete this order? This action cannot be undone.</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity 
                onPress={() => setShowConfirmDelete(false)}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleDeleteOrder}
                style={styles.confirmDeleteButton}
              >
                <Text style={styles.confirmDeleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Order Details Modal */}
      <Modal visible={!!selectedOrder} transparent animationType="slide">
        {selectedOrder && (
          <View style={styles.modalOverlay}>
            <View style={styles.detailsModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Order Details</Text>
                <TouchableOpacity 
                  onPress={() => setSelectedOrder(null)}
                  style={styles.closeButtonContainer}
                >
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Order Status Banner */}
                <View style={[styles.statusBanner, getStatusBannerStyle(selectedOrder.orderStatus)]}>
                  <Ionicons 
                    name={getStatusIcon(selectedOrder.orderStatus)} 
                    size={22} 
                    color="white" 
                  />
                  <Text style={styles.statusBannerText}>
                    {selectedOrder.orderStatus}
                  </Text>
                </View>
                
                {/* Order Info Section */}
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Order Information</Text>
                  <View style={styles.sectionContent}>
                    <DetailItem 
                      icon="document-text" 
                      label="Order ID" 
                      value={selectedOrder._id} 
                    />
                    <DetailItem 
                      icon="calendar" 
                      label="Order Date" 
                      value={new Date(selectedOrder.createdAt).toLocaleString()} 
                    />
                    <DetailItem 
                      icon="card" 
                      label="Payment Status" 
                      value={selectedOrder.paymentInfo?.status || 'Not paid'} 
                      valueColor={selectedOrder.paymentInfo?.status === 'succeeded' ? '#10B981' : '#F59E0B'}
                    />
                    <DetailItem 
                      icon="cash" 
                      label="Total Amount" 
                      value={`₱${selectedOrder.totalPrice?.toFixed(2)}`} 
                      valueStyle={styles.priceValue}
                    />
                  </View>
                </View>
                
                {/* Customer Information */}
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Customer Information</Text>
                  <View style={styles.sectionContent}>
                    {loadingUser ? (
                      <ActivityIndicator size="small" color="#4F46E5" />
                    ) : (
                      <>
                        <DetailItem 
                          icon="person" 
                          label="Name" 
                          value={getUserName(selectedOrder)} 
                        />
                        <DetailItem 
                          icon="mail" 
                          label="Email" 
                          value={
                            (() => {
                              const userId = selectedOrder.user?._id || selectedOrder.user;
                              if (typeof userId === 'string' && userData[userId]) {
                                return userData[userId].email || 'Unknown';
                              }
                              return selectedOrder.user?.email || 'Unknown';
                            })()
                          } 
                        />
                        {(() => {
                          const userId = selectedOrder.user?._id || selectedOrder.user;
                          if (typeof userId === 'string' && userData[userId] && userData[userId].phone) {
                            return (
                              <DetailItem 
                                icon="call" 
                                label="Phone" 
                                value={userData[userId].phone} 
                              />
                            );
                          }
                          return null;
                        })()}
                      </>
                    )}
                  </View>
                </View>
                
                {/* Shipping Information */}
                {selectedOrder.shippingInfo && (
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionTitle}>Shipping Information</Text>
                    <View style={styles.sectionContent}>
                      <DetailItem 
                        icon="location" 
                        label="Address" 
                        value={`${selectedOrder.shippingInfo.address}, ${selectedOrder.shippingInfo.city}, ${selectedOrder.shippingInfo.state || ''}, ${selectedOrder.shippingInfo.postalCode}, ${selectedOrder.shippingInfo.country}`} 
                      />
                      {selectedOrder.shippingInfo.phoneNo && (
                        <DetailItem 
                          icon="call" 
                          label="Contact" 
                          value={selectedOrder.shippingInfo.phoneNo} 
                        />
                      )}
                    </View>
                  </View>
                )}
                
                {/* Order Items */}
                {selectedOrder.orderItems && selectedOrder.orderItems.length > 0 && (
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionTitle}>Order Items</Text>
                    <View style={styles.sectionContent}>
                      {selectedOrder.orderItems.map((item, index) => (
                        <View key={index} style={styles.orderItemDetail}>
                          <View style={styles.productImageContainer}>
                            {item.image ? (
                              <Image 
                                source={{ uri: item.image }} 
                                style={styles.productImage}
                                resizeMode="cover"
                              />
                            ) : (
                              <View style={styles.noImageContainer}>
                                <Ionicons name="image" size={20} color="#9CA3AF" />
                              </View>
                            )}
                          </View>
                          <View style={styles.productInfo}>
                            <Text style={styles.productName}>{item.name || item.title || 'Product'}</Text>
                            <Text style={styles.productPrice}>₱{item.price?.toFixed(2)} × {item.quantity}</Text>
                          </View>
                          <Text style={styles.itemTotal}>₱{(item.price * item.quantity).toFixed(2)}</Text>
                        </View>
                      ))}
                      <View style={styles.orderSummary}>
                        <Text style={styles.summaryLabel}>Total:</Text>
                        <Text style={styles.summaryValue}>₱{selectedOrder.totalPrice?.toFixed(2)}</Text>
                      </View>
                    </View>
                  </View>
                )}
                
                {/* Status Management Section */}
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Status Management</Text>
                  <View style={styles.sectionContent}>
                    <Text style={styles.label}>Update Status</Text>
                    <View style={styles.statusSelectionContainer}>
                      {['Processing', 'Shipped', 'Delivered', 'Cancelled'].map(status => (
                        <TouchableOpacity
                          key={status}
                          style={[
                            styles.statusOption,
                            selectedOrder.orderStatus === status && styles.selectedStatusOption,
                            ['Delivered', 'Cancelled'].includes(selectedOrder.orderStatus) && 
                            selectedOrder.orderStatus !== status && styles.disabledStatusOption
                          ]}
                          disabled={['Delivered', 'Cancelled'].includes(selectedOrder.orderStatus) && 
                                   selectedOrder.orderStatus !== status}
                          onPress={() => handleStatusChange(selectedOrder._id, status)}
                        >
                          <Ionicons 
                            name={getStatusIcon(status)} 
                            size={18} 
                            color={selectedOrder.orderStatus === status ? 'white' : getStatusColor(status)} 
                          />
                          <Text 
                            style={[
                              styles.statusOptionText,
                              selectedOrder.orderStatus === status && styles.selectedStatusOptionText
                            ]}
                          >
                            {status}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    {(['Delivered', 'Cancelled'].includes(selectedOrder.orderStatus)) && (
                      <Text style={styles.statusWarning}>
                        <Ionicons name="information-circle" size={14} color="#6B7280" /> 
                        Status cannot be changed after being marked as {selectedOrder.orderStatus}
                      </Text>
                    )}
                  </View>
                </View>
                
                <TouchableOpacity 
                  onPress={() => setSelectedOrder(null)}
                  style={styles.closeDetailButton}
                >
                  <Text style={styles.closeDetailButtonText}>Close</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
};

const StatusBadge = ({ status }) => {
  let badgeStyle = [styles.statusBadge];
  let textStyle = [styles.statusText];
  
  if (status === 'Delivered') {
    badgeStyle.push(styles.statusDelivered);
    textStyle.push(styles.textDelivered);
  } else if (status === 'Shipped') {
    badgeStyle.push(styles.statusShipped);
    textStyle.push(styles.textShipped);
  } else if (status === 'Cancelled') {
    badgeStyle.push(styles.statusCancelled);
    textStyle.push(styles.textCancelled);
  } else {
    badgeStyle.push(styles.statusProcessing);
    textStyle.push(styles.textProcessing);
  }
  
  return (
    <View style={badgeStyle}>
      <Text style={textStyle}>{status}</Text>
    </View>
  );
};

const DetailItem = ({ icon, label, value, valueColor, valueStyle }) => (
  <View style={styles.detailItem}>
    <View style={styles.detailLabelContainer}>
      <Ionicons name={icon} size={16} color="#6B7280" style={styles.detailIcon} />
      <Text style={styles.detailLabel}>{label}</Text>
    </View>
    <Text style={[
      styles.detailValue, 
      valueColor ? { color: valueColor } : null,
      valueStyle
    ]}>
      {value}
    </Text>
  </View>
);

// Helper functions
const getStatusColor = (status) => {
  switch(status) {
    case 'Delivered': return '#059669';
    case 'Shipped': return '#2563EB';
    case 'Processing': return '#D97706';
    case 'Cancelled': return '#DC2626';
    default: return '#6B7280';
  }
};

const getStatusBannerStyle = (status) => {
  switch(status) {
    case 'Delivered': return { backgroundColor: '#059669' };
    case 'Shipped': return { backgroundColor: '#2563EB' };
    case 'Processing': return { backgroundColor: '#D97706' };
    case 'Cancelled': return { backgroundColor: '#DC2626' };
    default: return { backgroundColor: '#6B7280' };
  }
};

// Styles
const styles = {
  // Base
  container: { flex: 1, padding: 16, backgroundColor: '#F9FAFB' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  loadingText: { marginTop: 10, color: '#6B7280', fontSize: 16 },
  
  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
  refreshButton: { padding: 8, borderRadius: 8, backgroundColor: '#EEF2FF' },
  
  // Filters
  filtersContainer: { 
    backgroundColor: 'white', 
    padding: 8, 
    borderRadius: 10, 
    marginBottom: 12, 
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 1,
    flexDirection: 'row'
  },
  filterItem: { flex: 1, marginHorizontal: 1 },
  filterLabel: { fontSize: 11, fontWeight: '500', marginBottom: 4, color: '#374151' },
  pickerContainer: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 6, overflow: 'hidden' },
  picker: { height: 50, backgroundColor: '#F9FAFB' },
  
  // List
  list: { flex: 1 },
  listContent: { paddingBottom: 16 },
  orderItem: { 
    backgroundColor: 'white', 
    padding: 14, 
    marginBottom: 12, 
    borderRadius: 12, 
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  orderIdContainer: { flexDirection: 'row', alignItems: 'center' },
  statusIcon: { marginRight: 6 },
  orderId: { fontWeight: 'bold', color: '#374151', fontSize: 15 },
  
  // Order details
  orderDetails: { marginBottom: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  detailText: { marginLeft: 6, color: '#4B5563', fontSize: 13 },
  orderPrice: { marginLeft: 6, fontWeight: 'bold', color: '#111827', fontSize: 15 },
  
  // Actions
  orderActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
  buttonSpacer: { flex: 1 },
  deleteButton: { flexDirection: 'row', alignItems: 'center', padding: 8, borderRadius: 6, backgroundColor: '#FEE2E2' },
  deleteButtonText: { color: '#DC2626', marginLeft: 4, fontWeight: '500' },
  
  // Empty state
  emptyList: { 
    padding: 20, 
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    elevation: 1,
    marginTop: 16
  },
  emptyText: { color: '#4B5563', fontSize: 17, fontWeight: '500', marginTop: 16 },
  emptySubtext: { color: '#6B7280', marginTop: 6 },
  
  // Status Badges
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  statusDelivered: { backgroundColor: '#D1FAE5' },
  textDelivered: { color: '#065F46' },
  statusShipped: { backgroundColor: '#DBEAFE' },
  textShipped: { color: '#1E40AF' },
  statusCancelled: { backgroundColor: '#FEE2E2' },
  textCancelled: { color: '#B91C1C' },
  statusProcessing: { backgroundColor: '#FEF3C7' },
  textProcessing: { color: '#92400E' },
  
  // Delete Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: 'white', borderRadius: 16, padding: 20, width: '85%', maxWidth: 400, alignItems: 'center' },
  modalIconContainer: { marginBottom: 14 },
  warningIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 10 },
  modalText: { marginBottom: 20, textAlign: 'center', color: '#4B5563', lineHeight: 20 },
  modalActions: { flexDirection: 'row', justifyContent: 'center', width: '100%' },
  cancelButton: { 
    padding: 10,
    flex: 1,
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8
  },
  cancelButtonText: { color: '#374151', fontWeight: '500' },
  confirmDeleteButton: { backgroundColor: '#DC2626', padding: 10, borderRadius: 8, flex: 1, alignItems: 'center' },
  confirmDeleteText: { color: 'white', fontWeight: '500' },
  
  // Details Modal
  detailsModalContent: { 
    backgroundColor: 'white', 
    borderRadius: 16, 
    padding: 20, 
    width: '90%', 
    maxWidth: 500, 
    maxHeight: '85%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84
  },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  closeButtonContainer: { padding: 8, borderRadius: 20, backgroundColor: '#F3F4F6' },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16
  },
  statusBannerText: { color: 'white', fontWeight: 'bold', fontSize: 15, marginLeft: 8 },
  
  // Detail sections
  detailSection: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: '#111827' },
  sectionContent: { 
    backgroundColor: '#F9FAFB', 
    padding: 12, 
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6'
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  detailLabelContainer: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  detailIcon: { marginRight: 6 },
  detailLabel: { fontSize: 13, color: '#6B7280' },
  detailValue: { fontSize: 13, color: '#111827', fontWeight: '500', flex: 2, textAlign: 'right' },
  priceValue: { fontWeight: 'bold', color: '#111827' },
  
  // Product items
  orderItemDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  productImageContainer: {
    width: 45,
    height: 45,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    marginRight: 10
  },
  productImage: { width: '100%', height: '100%' },
  noImageContainer: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  productInfo: { flex: 1 },
  productName: { fontSize: 13, fontWeight: '500', color: '#111827', marginBottom: 2 },
  productPrice: { fontSize: 12, color: '#6B7280' },
  itemTotal: { fontSize: 13, fontWeight: 'bold', color: '#111827' },
  
  // Summary
  orderSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB'
  },
  summaryLabel: { fontSize: 15, fontWeight: 'bold', color: '#374151' },
  summaryValue: { fontSize: 15, fontWeight: 'bold', color: '#111827' },
  label: { fontSize: 13, fontWeight: '500', marginBottom: 10, color: '#374151' },
  
  // Status selection
  statusSelectionContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8, justifyContent: 'space-between' },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
    width: '48%'
  },
  statusOptionText: { marginLeft: 6, fontWeight: '500', color: '#374151', fontSize: 13 },
  selectedStatusOption: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  selectedStatusOptionText: { color: 'white' },
  disabledStatusOption: { opacity: 0.5 },
  statusWarning: { fontSize: 11, color: '#6B7280', fontStyle: 'italic', marginTop: 6 },
  
  // Close button
  closeDetailButton: { backgroundColor: '#F3F4F6', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 8, marginBottom: 8 },
  closeDetailButtonText: { fontWeight: '500', color: '#374151' }
};
export default AdminOrderScreen;