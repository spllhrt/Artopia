import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, 
  ActivityIndicator, SafeAreaView, Modal, TextInput, RefreshControl
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { getMyOrders, updateOrder } from '../../api/orderApi';
import { AntDesign } from '@expo/vector-icons';

const MyOrdersScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [cancelingOrderId, setCancelingOrderId] = useState(null);
  const userId = useSelector(state => state.auth.user?._id);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      'Processing': '#FF9800',
      'Shipped': '#2196F3',
      'Delivered': '#4CAF50',
      'Cancelled': '#F44336'
    };
    return colors[status] || '#607D8B';
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      const fetchedOrders = await dispatch(getMyOrders());
      setOrders(fetchedOrders);
    } catch (error) {
      Alert.alert('Error', 'Failed to load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadOrders(); }, [userId]);
  
  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const handleCancelOrder = async (orderId) => {
    try {
      setCancelingOrderId(orderId);
      Alert.alert(
        'Cancel Order',
        'Are you sure you want to cancel this order?',
        [
          { text: 'No', style: 'cancel', onPress: () => setCancelingOrderId(null) },
          { 
            text: 'Yes', 
            onPress: async () => {
              await dispatch(updateOrder(orderId, { status: 'Cancelled' }));
              Alert.alert('Success', 'Order cancelled successfully');
              loadOrders();
              setCancelingOrderId(null);
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to cancel order');
      setCancelingOrderId(null);
    }
  };

  const openReviewModal = (orderId) => {
    setSelectedOrderId(orderId);
    setReviewModalVisible(true);
  };

  const submitReview = async () => {
    try {
      if (!reviewText.trim()) {
        Alert.alert('Error', 'Please enter a review');
        return;
      }
      Alert.alert('Success', 'Your review has been submitted');
      setReviewModalVisible(false);
      setReviewText('');
      setReviewRating(5);
      setSelectedOrderId(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to submit review');
    }
  };

  const renderOrderItem = ({ item }) => {
    const isCancelled = item.orderStatus === 'Cancelled';
    const isDelivered = item.orderStatus === 'Delivered';
    const canCancel = !isCancelled && !isDelivered;
    const canReview = isDelivered;
    
    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderId}>Order #{item._id.slice(-8)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.orderStatus) }]}>
            <Text style={styles.statusText}>{item.orderStatus}</Text>
          </View>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.orderInfo}>
          <Text style={styles.infoLabel}>Date:</Text>
          <Text style={styles.infoValue}>{formatDate(item.createdAt)}</Text>
        </View>
        
        <View style={styles.orderInfo}>
          <Text style={styles.infoLabel}>Items:</Text>
          <Text style={styles.infoValue}>{item.orderItems.length}</Text>
        </View>
        
        <View style={styles.orderInfo}>
          <Text style={styles.infoLabel}>Total:</Text>
          <Text style={styles.infoValue}>${item.totalPrice.toFixed(2)}</Text>
        </View>
        <View style={styles.divider} />
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.detailsButton}
            onPress={() => navigation.navigate('OrderDetails', { orderId: item._id })}
          >
            <Text style={styles.detailsButtonText}>View Details</Text>
          </TouchableOpacity>
          
          {canCancel && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => handleCancelOrder(item._id)}
              disabled={cancelingOrderId === item._id}
            >
              {cancelingOrderId === item._id ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.actionButtonText}>Cancel Order</Text>
              )}
            </TouchableOpacity>
          )}
          
          {canReview && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.reviewButton]}
              onPress={() => openReviewModal(item._id)}
            >
              <Text style={styles.actionButtonText}>Leave Review</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <AntDesign name="shoppingcart" size={64} color="#ccc" />
      <Text style={styles.emptyText}>You haven't placed any orders yet</Text>
      <TouchableOpacity 
        style={styles.shopButton}
        onPress={() => navigation.navigate('Shop', { 
          screen: 'Shop', 
          params: { 
            screen: 'ShopMain' 
          }
        })}
      >
        <Text style={styles.shopButtonText}>Start Shopping</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>My Orders</Text>
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={styles.loadingText}>Loading your orders...</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id}
          renderItem={renderOrderItem}
          ListEmptyComponent={renderEmptyList}
          contentContainerStyle={orders.length === 0 ? { flex: 1 } : { paddingBottom: 20 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#0066cc"]} />
          }
        />
      )}
      
      <Modal
        visible={reviewModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setReviewModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Write a Review</Text>
            
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((rating) => (
                <TouchableOpacity key={rating} onPress={() => setReviewRating(rating)}>
                  <AntDesign
                    name={rating <= reviewRating ? "star" : "staro"}
                    size={30}
                    color={rating <= reviewRating ? "#FFD700" : "#ccc"}
                    style={styles.starIcon}
                  />
                </TouchableOpacity>
              ))}
            </View>
            
            <TextInput
              style={styles.reviewInput}
              multiline
              numberOfLines={5}
              placeholder="Share your experience with this product..."
              value={reviewText}
              onChangeText={setReviewText}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => setReviewModalVisible(false)}
              >
                <Text style={styles.cancelModalButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.submitModalButton]}
                onPress={submitReview}
              >
                <Text style={styles.submitModalButtonText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8', padding: 10 },
  title: { fontSize: 24, fontWeight: 'bold', marginVertical: 20, textAlign: 'center' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 16 },
  orderCard: {
    backgroundColor: 'white', borderRadius: 10, marginBottom: 15, padding: 15,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 3
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderId: { fontSize: 16, fontWeight: 'bold' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  divider: { borderBottomWidth: 1, borderBottomColor: '#e0e0e0', marginVertical: 10 },
  orderInfo: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 5 },
  infoLabel: { fontSize: 14, color: '#666' },
  infoValue: { fontSize: 14, fontWeight: '500' },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  detailsButton: {
    flex: 1, backgroundColor: '#e0e0e0', padding: 10,
    borderRadius: 5, alignItems: 'center', marginRight: 5
  },
  detailsButtonText: { color: '#333', fontWeight: '500' },
  actionButton: { flex: 1, padding: 10, borderRadius: 5, alignItems: 'center', marginLeft: 5 },
  cancelButton: { backgroundColor: '#F44336' },
  reviewButton: { backgroundColor: '#4CAF50' },
  actionButtonText: { color: 'white', fontWeight: '500' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { fontSize: 16, color: '#666', marginTop: 20, marginBottom: 30, textAlign: 'center' },
  shopButton: { backgroundColor: '#0066cc', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 5 },
  shopButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', padding: 20
  },
  modalContent: {
    backgroundColor: 'white', borderRadius: 10,
    padding: 20, width: '100%', elevation: 5
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  ratingContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 15 },
  starIcon: { marginHorizontal: 5 },
  reviewInput: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 5,
    padding: 10, textAlignVertical: 'top', minHeight: 100, marginBottom: 15
  },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-around' },
  modalButton: {
    paddingVertical: 10, paddingHorizontal: 20,
    borderRadius: 5, minWidth: 100, alignItems: 'center'
  },
  cancelModalButton: { backgroundColor: '#f0f0f0', marginRight: 10 },
  cancelModalButtonText: { color: '#666', fontWeight: '500' },
  submitModalButton: { backgroundColor: '#0066cc' },
  submitModalButtonText: { color: 'white', fontWeight: '500' }
});

export default MyOrdersScreen;