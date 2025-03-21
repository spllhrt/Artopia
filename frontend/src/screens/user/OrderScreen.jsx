import React, { useState, useEffect, useCallback, memo } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, 
  ActivityIndicator, SafeAreaView, Modal, TextInput, RefreshControl,
  Dimensions, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { getMyOrders, updateOrder, getOrderDetails } from '../../api/orderApi';
import { createReview, getReviewsByItem, updateReview, deleteReview, getUserReviewForItem } from '../../api/reviewApi';
import { AntDesign } from '@expo/vector-icons';

const MyOrdersScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const userId = useSelector(state => state.auth.user?._id);
  
  // State
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [selectedItemType, setSelectedItemType] = useState(null);
  const [selectedItemName, setSelectedItemName] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [cancelingOrderId, setCancelingOrderId] = useState(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [orderItems, setOrderItems] = useState([]);
  const [existingReview, setExistingReview] = useState(null);
  const [isEditingReview, setIsEditingReview] = useState(false);
  const [itemReviews, setItemReviews] = useState({});
  const [windowDimensions, setWindowDimensions] = useState(Dimensions.get('window'));
  
  // Track window dimensions for responsiveness
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setWindowDimensions(window);
    });
    return () => subscription?.remove();
  }, []);
  
  // Helpers
  const formatDate = dateString => new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
  
  const getStatusColor = status => {
    const colors = {
      'Processing': '#FF9800', 'Shipped': '#2196F3',
      'Delivered': '#4CAF50', 'Cancelled': '#F44336'
    };
    return colors[status] || '#607D8B';
  };
  
  // Data loading
  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const fetchedOrders = await dispatch(getMyOrders());
      setOrders(fetchedOrders || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dispatch]);
  
  useEffect(() => { loadOrders(); }, [loadOrders, userId]);
  
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadOrders();
  }, [loadOrders]);
  
  // Order actions
  const handleCancelOrder = useCallback(async (orderId) => {
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
              try {
                await dispatch(updateOrder(orderId, { status: 'Cancelled' }));
                Alert.alert('Success', 'Order cancelled successfully');
                loadOrders();
              } catch (err) {
                Alert.alert('Error', 'Failed to cancel order');
              } finally {
                setCancelingOrderId(null);
              }
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to cancel order');
      setCancelingOrderId(null);
    }
  }, [dispatch, loadOrders]);
  
  // Review functions
  const determineItemTypeAndId = useCallback((item) => {
    const itemId = item.product || item.product_id || item._id;
    const itemName = item.name || item.title || item.product_name || 
              (item.product ? `Product #${item.product.slice(-6)}` : 'Unknown Item');
    
    let itemType = 'artwork';
    let displayType = 'Artwork';
    
    // Check for art materials
    const isArtMaterial = 
      item.category === 'artmat' || 
      item.type === 'artmat' || 
      /brush|canvas|paint|material|supply|tool/i.test(itemName);
    
    if (isArtMaterial) {
      itemType = 'artmat';
      displayType = 'Art Material';
    }
    
    return { itemId, itemType, itemName, displayType };
  }, []);
  
  const openReviewModal = useCallback(async (orderId) => {
    try {
      const orderDetails = await dispatch(getOrderDetails(orderId));
      if (orderDetails?.orderItems?.length > 0) {
        setOrderItems(orderDetails.orderItems);
        setSelectedOrderId(orderId);
        
        // Fetch ONLY the current user's reviews for items in this order
        const reviewsObj = {};
        for (const item of orderDetails.orderItems) {
          const { itemId, itemType } = determineItemTypeAndId(item);
          try {
            // Option 1: If getReviewsByItem supports filtering by userId
            const reviews = await getReviewsByItem(itemType, itemId, userId);
            
            // Option 2: If getReviewsByItem doesn't properly filter by userId,
            // replace with a function that specifically gets only the user's reviews
            // const reviews = await getUserReviewForItem(itemType, itemId, userId);
            
            if (reviews?.length > 0) {
              // Only store the user's own review
              const userReview = reviews.find(review => review.user === userId || review.user_id === userId);
              if (userReview) {
                reviewsObj[`${itemType}-${itemId}`] = userReview;
              }
            }
          } catch (err) {
            console.log(`Error fetching reviews:`, err);
          }
        }
        setItemReviews(reviewsObj);
        setReviewModalVisible(true);
      } else {
        Alert.alert('Error', 'No items found to review');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load order details');
    }
  }, [dispatch, determineItemTypeAndId, userId]);
  
  
  const selectItemToReview = useCallback((item) => {
    const { itemId, itemType, itemName } = determineItemTypeAndId(item);
    const existingReviewKey = `${itemType}-${itemId}`;
    const review = itemReviews[existingReviewKey];
    
    setSelectedItemId(itemId);
    setSelectedItemType(itemType);
    setSelectedItemName(itemName);
    
    if (review) {
      setExistingReview(review);
      setReviewText(review.comment);
      setReviewRating(review.rating);
      setIsEditingReview(true);
    } else {
      setExistingReview(null);
      setReviewText('');
      setReviewRating(5);
      setIsEditingReview(false);
    }
  }, [itemReviews, determineItemTypeAndId]);
  
  const resetReviewForm = useCallback(() => {
    setSelectedItemId(null);
    setSelectedItemType(null);
    setSelectedItemName('');
    setReviewText('');
    setReviewRating(5);
    setExistingReview(null);
    setIsEditingReview(false);
  }, []);
  
  const submitReview = useCallback(async (textToSubmit) => {
    try {
      const finalReviewText = textToSubmit || reviewText;
      
      if (!finalReviewText.trim()) {
        Alert.alert('Error', 'Please enter a review');
        return;
      }
      
      setSubmittingReview(true);
      const reviewData = { rating: reviewRating, comment: finalReviewText };
      
      if (isEditingReview && existingReview) {
        await updateReview(selectedItemType, selectedItemId, existingReview._id, reviewData);
        Alert.alert('Success', 'Review updated');
        setItemReviews(prev => ({
          ...prev,
          [`${selectedItemType}-${selectedItemId}`]: { ...existingReview, ...reviewData }
        }));
      } else {
        const newReview = await createReview(selectedItemType, selectedItemId, reviewData);
        Alert.alert('Success', 'Review submitted');
        setItemReviews(prev => ({
          ...prev,
          [`${selectedItemType}-${selectedItemId}`]: newReview
        }));
      }
      
      resetReviewForm();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  }, [reviewRating, reviewText, isEditingReview, existingReview, selectedItemType, selectedItemId, resetReviewForm]);
  
  const handleDeleteReview = useCallback(() => {
    Alert.alert(
      'Delete Review',
      'Are you sure you want to delete this review?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              setSubmittingReview(true);
              await deleteReview(selectedItemType, selectedItemId, existingReview._id);
              
              setItemReviews(prev => {
                const newItemReviews = {...prev};
                delete newItemReviews[`${selectedItemType}-${selectedItemId}`];
                return newItemReviews;
              });
              
              Alert.alert('Success', 'Review deleted');
              resetReviewForm();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete review');
            } finally {
              setSubmittingReview(false);
            }
          }
        }
      ]
    );
  }, [selectedItemType, selectedItemId, existingReview, resetReviewForm]);
  
  // Components
  const OrderCard = memo(({ item }) => {
    const isCancelled = item.orderStatus === 'Cancelled';
    const isDelivered = item.orderStatus === 'Delivered';
    const canCancel = !isCancelled && !isDelivered;
    
    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderId}>Order #{item._id.slice(-8)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.orderStatus) }]}>
            <Text style={styles.statusText}>{item.orderStatus}</Text>
          </View>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.orderDetails}>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.label}>Date</Text>
              <Text style={styles.value}>{formatDate(item.createdAt)}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.label}>Items</Text>
              <Text style={styles.value}>{item.orderItems.length}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.label}>Total</Text>
              <Text style={styles.value}>${item.totalPrice.toFixed(2)}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={styles.mainButton}
            onPress={() => navigation.navigate('OrderDetails', { orderId: item._id })}
          >
            <Text style={styles.mainButtonText}>View Details</Text>
          </TouchableOpacity>
          
          <View style={styles.secondaryButtons}>
            {canCancel && (
              <TouchableOpacity 
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => handleCancelOrder(item._id)}
                disabled={cancelingOrderId === item._id}
              >
                {cancelingOrderId === item._id ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.actionButtonText}>Cancel</Text>
                )}
              </TouchableOpacity>
            )}
            
            {isDelivered && (
              <TouchableOpacity 
                style={[styles.actionButton, styles.reviewButton]}
                onPress={() => openReviewModal(item._id)}
              >
                <Text style={styles.actionButtonText}>Reviews</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  });
  
  const EmptyOrdersList = memo(() => (
    <View style={styles.emptyContainer}>
      <AntDesign name="shoppingcart" size={64} color="#ccc" />
      <Text style={styles.emptyText}>You haven't placed any orders yet</Text>
      <TouchableOpacity 
        style={styles.shopButton}
        onPress={() => navigation.navigate('Shop', { 
          screen: 'Shop', 
          params: { screen: 'ShopMain' }
        })}
      >
        <Text style={styles.shopButtonText}>Start Shopping</Text>
      </TouchableOpacity>
    </View>
  ));
  
  const ItemSelector = memo(() => (
    <View style={styles.itemSelectorContainer}>
      <Text style={styles.modalTitle}>Select an item to review</Text>
      <FlatList
        data={orderItems}
        keyExtractor={(item, index) => `${item._id || item.product || index}`}
        renderItem={({ item }) => {
          const { itemId, itemType, itemName, displayType } = determineItemTypeAndId(item);
          const hasReview = itemReviews[`${itemType}-${itemId}`];
          
          return (
            <TouchableOpacity 
              style={styles.itemOption}
              onPress={() => selectItemToReview(item)}
            >
              <Text style={styles.itemName} numberOfLines={1} ellipsizeMode="tail">
                {itemName}
              </Text>
              <View style={styles.reviewStatus}>
                <View style={[
                  styles.itemTypeTag, 
                  hasReview ? styles.reviewedTag : null
                ]}>
                  <Text style={[
                    styles.itemTypeText,
                    hasReview ? styles.reviewedText : null
                  ]}>
                    {hasReview ? 'Reviewed' : displayType}
                  </Text>
                </View>
                <AntDesign name="right" size={16} color="#999" />
              </View>
            </TouchableOpacity>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
        ListEmptyComponent={() => (
          <View style={styles.emptyItemsContainer}>
            <Text style={styles.emptyItemsText}>No items available for review</Text>
          </View>
        )}
      />
      
      <TouchableOpacity 
        style={styles.closeModalButton}
        onPress={() => setReviewModalVisible(false)}
      >
        <Text style={styles.closeModalText}>Close</Text>
      </TouchableOpacity>
    </View>
  ));
  
  const ReviewForm = memo(() => {
    const [localReviewText, setLocalReviewText] = useState(reviewText);
    
    useEffect(() => {
      setLocalReviewText(reviewText);
    }, [reviewText]);
    
    // Calculate responsive dimensions based on screen size
    const isLandscape = windowDimensions.width > windowDimensions.height;
    const modalWidth = Math.min(windowDimensions.width * 0.9, 600);
    const inputHeight = isLandscape ? windowDimensions.height * 0.3 : windowDimensions.height * 0.2;
    
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <Text style={styles.modalTitle}>
            {isEditingReview ? 'Edit Review' : 'New Review'}
          </Text>
          <Text style={styles.itemNameTitle} numberOfLines={2} ellipsizeMode="tail">
            {selectedItemName}
          </Text>
          
          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map((rating) => (
              <TouchableOpacity 
                key={rating} 
                onPress={() => setReviewRating(rating)}
                style={styles.starButton}
              >
                <AntDesign
                  name={rating <= reviewRating ? "star" : "staro"}
                  size={isLandscape ? 24 : 30}
                  color={rating <= reviewRating ? "#FFD700" : "#ccc"}
                />
              </TouchableOpacity>
            ))}
          </View>
          
          <TextInput
            style={[
              styles.reviewInput,
              { 
                minHeight: inputHeight,
                width: '100%'
              }
            ]}
            multiline={true}
            numberOfLines={4}
            placeholder="Share your experience with this product..."
            value={localReviewText}
            onChangeText={setLocalReviewText}
            maxLength={500}
            autoCapitalize="sentences"
            autoCorrect={true}
          />
          
          <View style={[
            styles.modalButtons,
            isLandscape && { flexDirection: 'row' }
          ]}>
            {isEditingReview && (
              <TouchableOpacity 
                style={[
                  styles.modalButton, 
                  styles.deleteButton,
                  isLandscape ? { flex: 1, marginHorizontal: 4 } : { marginBottom: 8 }
                ]}
                onPress={handleDeleteReview}
              >
                <Text style={styles.buttonText}>Delete</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[
                styles.modalButton, 
                styles.backButton,
                isLandscape ? { flex: 1, marginHorizontal: 4 } : { marginBottom: 8 }
              ]}
              onPress={resetReviewForm}
            >
              <Text style={[styles.buttonText, { color: '#333' }]}>Back</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.modalButton, 
                styles.submitButton,
                isLandscape ? { flex: 1, marginHorizontal: 4 } : {}
              ]}
              onPress={() => submitReview(localReviewText)}
              disabled={submittingReview}
            >
              {submittingReview ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>
                  {isEditingReview ? 'Update' : 'Submit'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  });
  
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
          keyExtractor={item => item._id}
          renderItem={({ item }) => <OrderCard item={item} />}
          ListEmptyComponent={<EmptyOrdersList />}
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
        onRequestClose={() => {
          selectedItemId ? resetReviewForm() : setReviewModalVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[
            styles.modalContent,
            { width: Math.min(windowDimensions.width * 0.9, 600) }
          ]}>
            {!selectedItemId ? <ItemSelector /> : <ReviewForm />}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8f9fa',
    padding: 12 
  },
  title: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    marginVertical: 16, 
    textAlign: 'center',
    color: '#2a2a2a'
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  loadingText: { 
    marginTop: 12, 
    fontSize: 16,
    color: '#555'
  },
  
  // Order card
  orderCard: {
    backgroundColor: 'white', 
    borderRadius: 16, 
    marginBottom: 16, 
    padding: 16,
    elevation: 2, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, 
    shadowRadius: 4
  },
  orderHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  orderId: { 
    fontSize: 16, 
    fontWeight: 'bold',
    color: '#333'
  },
  statusBadge: { 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 16 
  },
  statusText: { 
    color: 'white', 
    fontSize: 12, 
    fontWeight: 'bold' 
  },
  divider: { 
    borderBottomWidth: 1, 
    borderBottomColor: '#eee', 
    marginVertical: 12 
  },
  
  // Order details
  orderDetails: { 
    marginVertical: 8 
  },
  detailRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between' 
  },
  detailItem: { 
    alignItems: 'center', 
    flex: 1 
  },
  label: { 
    fontSize: 13, 
    color: '#666', 
    marginBottom: 4 
  },
  value: { 
    fontSize: 15, 
    fontWeight: '600',
    color: '#333'
  },
  
  // Buttons
  buttonRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between' 
  },
  mainButton: {
    flex: 1, 
    backgroundColor: '#f0f0f0', 
    paddingVertical: 12,
    borderRadius: 10, 
    alignItems: 'center', 
    marginRight: 8
  },
  mainButtonText: { 
    color: '#333', 
    fontWeight: '600' 
  },
  secondaryButtons: { 
    flexDirection: 'row' 
  },
  actionButton: { 
    paddingVertical: 12, 
    paddingHorizontal: 16, 
    borderRadius: 10, 
    marginLeft: 8, 
    alignItems: 'center' 
  },
  cancelButton: { 
    backgroundColor: '#f44336' 
  },
  reviewButton: { 
    backgroundColor: '#4caf50' 
  },
  actionButtonText: { 
    color: 'white', 
    fontWeight: '600' 
  },
  
  // Empty state
  emptyContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20 
  },
  emptyText: { 
    fontSize: 16, 
    color: '#666', 
    marginTop: 20, 
    marginBottom: 30, 
    textAlign: 'center' 
  },
  shopButton: { 
    backgroundColor: '#0066cc', 
    paddingVertical: 14, 
    paddingHorizontal: 28, 
    borderRadius: 12 
  },
  shopButtonText: { 
    color: 'white', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  
  // Modal
  modalOverlay: {
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20
  },
  modalContent: {
    backgroundColor: 'white', 
    borderRadius: 16,
    padding: 20, 
    maxHeight: '90%'
  },
  modalTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    marginBottom: 8, 
    textAlign: 'center',
    color: '#333'
  },
  itemNameTitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    color: '#555'
  },
  
  // Review form
  keyboardAvoidingView: {
    width: '100%'
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 10
  },
  ratingContainer: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    marginBottom: 16 
  },
  starButton: {
    padding: 6
  },
  reviewInput: {
    borderWidth: 1, 
    borderColor: '#ddd', 
    borderRadius: 12,
    padding: 14, 
    textAlignVertical: 'top', 
    fontSize: 15,
    marginBottom: 16
  },
  modalButtons: { 
    width: '100%'
  },
  modalButton: {
    paddingVertical: 14, 
    paddingHorizontal: 8,
    borderRadius: 10, 
    alignItems: 'center', 
  },
  backButton: { 
    backgroundColor: '#f1f1f1' 
  },
  submitButton: { 
    backgroundColor: '#0066cc' 
  },
  deleteButton: { 
    backgroundColor: '#f44336' 
  },
  buttonText: { 
    color: 'white', 
    fontWeight: '600' 
  },
  
  // Item selector
  itemSelectorContainer: { 
    width: '100%' 
  },
  itemOption: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    padding: 16, 
    backgroundColor: '#f9f9f9', 
    borderRadius: 12
  },
  itemName: { 
    fontSize: 16, 
    flex: 1,
    color: '#333'
  },
  reviewStatus: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  itemTypeTag: {
    backgroundColor: '#e0e0e0', 
    paddingHorizontal: 10,
    paddingVertical: 5, 
    borderRadius: 16, 
    marginRight: 8
  },
  reviewedTag: { 
    backgroundColor: '#4caf50' 
  },
  itemTypeText: { 
    fontSize: 12, 
    color: '#333' 
  },
  reviewedText: {
    color: 'white'
  },
  itemSeparator: { 
    height: 8
  },
  emptyItemsContainer: { 
    padding: 20, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  emptyItemsText: { 
    fontSize: 16, 
    color: '#666', 
    textAlign: 'center' 
  },
  closeModalButton: {
    marginTop: 16,
    paddingVertical: 14,
    backgroundColor: '#f1f1f1',
    borderRadius: 10,
    alignItems: 'center'
  },
  closeModalText: {
    color: '#333',
    fontWeight: '600'
  }
});

export default MyOrdersScreen;