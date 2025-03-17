import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  Dimensions,
  Alert,
  StatusBar,
  Modal,
  SafeAreaView
} from "react-native";
import { useSelector, useDispatch } from "react-redux"; 
import { setSelectedArtmat, setLoading, setError } from "../../redux/slices/matSlice";
import { addArtmatToCart } from "../../utils/cart"; 
import { getSingleArtmat } from "../../api/matApi";
const { width, height } = Dimensions.get("window");

const ArtmatDetailScreen = ({ route, navigation }) => {
  const { id } = route.params;
  const dispatch = useDispatch();
  
  // Get data from Redux store
  const artmat = useSelector(state => state.artmats.selectedArtmat);
  const loading = useSelector(state => state.artmats.loading);
  const error = useSelector(state => state.artmats.error);
  const userId = useSelector(state => state.auth.user?._id || state.auth.user?.id);
  
  // Local state
  const [imageIndex, setImageIndex] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchArtmatDetails();
    
    // Set navigation options dynamically when artmat loads
    if (artmat) {
      navigation.setOptions({
        headerTitle: artmat.name,
      });
    }
  }, [artmat?.name]);

  const fetchArtmatDetails = async () => {
    try {
      dispatch(setLoading(true));
      const response = await getSingleArtmat(id);
      dispatch(setSelectedArtmat(response.artmat));
      dispatch(setError(null));
    } catch (err) {
      console.error("Error details:", JSON.stringify(err, null, 2));
      dispatch(setError(err.message || "Failed to load art material details"));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const getImageUri = (artmat) => {
    if (!artmat?.images) return null;
    
    if (Array.isArray(artmat.images) && artmat.images.length > 0) {
      if (typeof artmat.images[imageIndex] === 'string') {
        return artmat.images[imageIndex];
      }
      
      if (typeof artmat.images[imageIndex] === 'object' && artmat.images[imageIndex]?.url) {
        return artmat.images[imageIndex].url;
      }
    }
    
    return null;
  };

  const formatPrice = (price) => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const handleNextImage = () => {
    if (artmat && artmat.images && imageIndex < artmat.images.length - 1) {
      setImageIndex(imageIndex + 1);
    }
  };

  const handlePrevImage = () => {
    if (imageIndex > 0) {
      setImageIndex(imageIndex - 1);
    }
  };

  const increaseQuantity = () => {
    if (quantity < artmat.stock) {
      setQuantity(quantity + 1);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleAddToCart = async () => {
    try {
      if (!userId) {
        Alert.alert(
          "Login Required",
          "Please log in to add items to your cart.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Log In", onPress: () => navigation.navigate("Login") }
          ]
        );
        return;
      }
      
      // Check if artmat is valid and has an id
      if (!artmat || (!artmat.id && !artmat._id)) {
        console.error('Invalid artwork object:', artmat);
        Alert.alert(
          "Error",
          "Cannot add this artwork to cart: Missing artmat ID.",
          [{ text: "OK" }]
        );
        return;
      }

      const artmatWithId = {
        ...artmat,
        id: artmat.id || artmat._id // Use existing id or _id as fallback
      };
      
      // Log the art material being added for debugging
      console.log('Adding art material to cart:', JSON.stringify(artmat));
      console.log('User ID:', userId);
      
      // Add art material to cart with specified quantity
      const result = await addArtmatToCart(artmatWithId, userId, quantity);
      
      if (result.success) {
        Alert.alert(
          "Added to Cart",
          `${quantity} ${quantity > 1 ? "units" : "unit"} of "${artmatWithId.name}" ${quantity > 1 ? "have" : "has"} been added to your cart.`,
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert(
        "Error",
        "There was a problem adding this item to your cart. Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  const openImageViewer = () => {
    setModalVisible(true);
  };

  const closeImageViewer = () => {
    setModalVisible(false);
  };

  const renderImageNavigation = () => {
    if (!artmat || !artmat.images || artmat.images.length <= 1) return null;
    
    return (
      <View style={styles.imageNavigation}>
        <TouchableOpacity 
          style={[styles.navButton, imageIndex === 0 && styles.navButtonDisabled]}
          onPress={handlePrevImage}
          disabled={imageIndex === 0}
        >
          <Text style={styles.navButtonText}>‹</Text>
        </TouchableOpacity>
        
        <Text style={styles.imageCounter}>
          {imageIndex + 1} / {artmat.images.length}
        </Text>
        
        <TouchableOpacity 
          style={[styles.navButton, imageIndex === artmat.images.length - 1 && styles.navButtonDisabled]}
          onPress={handleNextImage}
          disabled={imageIndex === artmat.images.length - 1}
        >
          <Text style={styles.navButtonText}>›</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderImageViewer = () => {
    if (!artmat || !artmat.images) return null;
    
    const imageUri = getImageUri(artmat);
    
    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeImageViewer}
      >
        <SafeAreaView style={styles.modalContainer}>
          <StatusBar barStyle="light-content" backgroundColor="#000000" />
          
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeImageViewer} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            
            <Text style={styles.modalImageCounter}>
              {imageIndex + 1} / {artmat.images.length}
            </Text>
          </View>
          
          <TouchableOpacity 
            activeOpacity={1}
            style={styles.modalImageContainer}
            onPress={closeImageViewer}
          >
            {imageUri ? (
              <Image 
                source={{ uri: imageUri }} 
                style={styles.modalImage} 
                resizeMode="contain" 
              />
            ) : (
              <View style={styles.modalPlaceholderImage}>
                <Text style={styles.placeholderText}>No Image</Text>
              </View>
            )}
          </TouchableOpacity>
          
          {artmat.images.length > 1 && (
            <View style={styles.modalNavigation}>
              <TouchableOpacity
                style={[styles.modalNavButton, imageIndex === 0 && styles.navButtonDisabled]}
                onPress={handlePrevImage}
                disabled={imageIndex === 0}
              >
                <Text style={styles.modalNavButtonText}>‹</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalNavButton, imageIndex === artmat.images.length - 1 && styles.navButtonDisabled]}
                onPress={handleNextImage}
                disabled={imageIndex === artmat.images.length - 1}
              >
                <Text style={styles.modalNavButtonText}>›</Text>
              </TouchableOpacity>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    );
  };

  const renderThumbnails = () => {
    if (!artmat || !artmat.images || artmat.images.length <= 1) return null;
    
    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.thumbnailsContainer}
      >
        {artmat.images.map((image, index) => {
          const thumbUri = typeof image === 'string' ? image : image?.url;
          return (
            <TouchableOpacity 
              key={index} 
              onPress={() => setImageIndex(index)}
              style={[
                styles.thumbnail, 
                imageIndex === index && styles.thumbnailActive
              ]}
            >
              {thumbUri ? (
                <Image 
                  source={{ uri: thumbUri }} 
                  style={styles.thumbnailImage} 
                  resizeMode="cover" 
                />
              ) : (
                <View style={styles.thumbnailPlaceholder}>
                  <Text style={styles.thumbnailPlaceholderText}>?</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  const renderReviews = () => {
    if (!artmat || !artmat.reviews || artmat.reviews.length === 0) {
      return (
        <View style={styles.emptyReviews}>
          <Text style={styles.emptyReviewsText}>No reviews yet</Text>
        </View>
      );
    }
    return artmat.reviews.map((review, index) => (
      <View key={review._id || index} style={styles.reviewItem}>
        <View style={styles.reviewHeader}>
          <Text style={styles.reviewerName}>{review.name || "Anonymous"}</Text>
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingText}>
              {'★'.repeat(review.rating)}
              {'☆'.repeat(5 - review.rating)}
            </Text>
          </View>
        </View>
        <Text style={styles.reviewText}>{review.comment}</Text>
      </View>
    ));
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <ActivityIndicator size="large" color="#2a9d8f" />
        <Text style={styles.loadingText}>Loading art material details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchArtmatDetails}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!artmat) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <Text style={styles.errorText}>Art material not found</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const imageUri = getImageUri(artmat);
  const isInStock = artmat.stock > 0;

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <TouchableOpacity 
          style={styles.imageContainer}
          onPress={openImageViewer}
          activeOpacity={0.9}
        >
          {imageUri ? (
            <Image 
              source={{ uri: imageUri }} 
              style={styles.artmatImage} 
              resizeMode="cover" 
            />
          ) : (
            <View style={[styles.artmatImage, styles.placeholderImage]}>
              <Text style={styles.placeholderText}>No Image</Text>
            </View>
          )}
          {renderImageNavigation()}
          {artmat.stock <= 0 && (
            <View style={styles.statusBadgeContainer}>
              <View style={[styles.statusBadge, {backgroundColor: '#F44336'}]}>
                <Text style={styles.statusText}>Out of Stock</Text>
              </View>
            </View>
          )}
        </TouchableOpacity>
        
        {renderThumbnails()}
        
        <View style={styles.detailsContainer}>
          <Text style={styles.title}>{artmat.name}</Text>
          <Text style={styles.category}>{artmat.category}</Text>
          
          <View style={styles.priceRatingContainer}>
            <Text style={styles.price}>${formatPrice(artmat.price)}</Text>
            {artmat.ratings > 0 && (
              <View style={styles.ratingContainer}>
                <Text style={styles.ratingText}>★ {artmat.ratings}</Text>
                <Text style={styles.reviewCount}>({artmat.numOfReviews} reviews)</Text>
              </View>
            )}
          </View>
          
          {/* Stock Information */}
          <View style={styles.stockInfoContainer}>
            <Text style={isInStock ? styles.inStock : styles.outOfStock}>
              {isInStock ? `In Stock: ${artmat.stock} units` : "Out of Stock"}
            </Text>
          </View>
          
          {/* Quantity Selector */}
          {isInStock && (
            <View style={styles.quantityContainer}>
              <Text style={styles.quantityLabel}>Quantity:</Text>
              <View style={styles.quantityControls}>
                <TouchableOpacity 
                  style={[styles.quantityButton, quantity <= 1 && styles.quantityButtonDisabled]}
                  onPress={decreaseQuantity}
                  disabled={quantity <= 1}
                >
                  <Text style={styles.quantityButtonText}>−</Text>
                </TouchableOpacity>
                
                <Text style={styles.quantityValue}>{quantity}</Text>
                
                <TouchableOpacity 
                  style={[styles.quantityButton, quantity >= artmat.stock && styles.quantityButtonDisabled]}
                  onPress={increaseQuantity}
                  disabled={quantity >= artmat.stock}
                >
                  <Text style={styles.quantityButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          
          <TouchableOpacity 
            style={[styles.addToCartButton, !isInStock && styles.disabledButton]} 
            onPress={handleAddToCart}
            disabled={!isInStock}
          >
            <Text style={styles.addToCartButtonText}>
              {isInStock ? 'Add to Cart' : 'Out of Stock'}
            </Text>
          </TouchableOpacity>
          
          <View style={styles.descriptionContainer}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{artmat.description || "No description available."}</Text>
          </View>
          
          <View style={styles.reviewsContainer}>
            <Text style={styles.sectionTitle}>Reviews</Text>
            {renderReviews()}
          </View>
        </View>
      </ScrollView>
      
      {renderImageViewer()}
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  imageContainer: {
    width: "100%",
    height: 350,
    position: "relative",
  },
  artmatImage: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: "#888",
    fontSize: 16,
    fontWeight: "bold",
  },
  imageNavigation: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    bottom: 10,
    left: 0,
    right: 0,
    paddingHorizontal: 15,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  imageCounter: {
    color: "#fff",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    fontSize: 14,
  },
  statusBadgeContainer: {
    position: "absolute",
    top: 10,
    right: 10,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  statusText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
    textTransform: "uppercase",
  },
  thumbnailsContainer: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  thumbnail: {
    width: 60,
    height: 60,
    marginRight: 10,
    borderRadius: 5,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  thumbnailActive: {
    borderColor: "#2a9d8f",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
  thumbnailPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  thumbnailPlaceholderText: {
    color: "#888",
    fontSize: 16,
    fontWeight: "bold",
  },
  detailsContainer: {
    padding: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  category: {
    fontSize: 14,
    color: "#888",
    marginBottom: 10,
  },
  priceRatingContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  price: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2a9d8f",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontSize: 16,
    color: "#f4a261",
    marginRight: 5,
  },
  reviewCount: {
    fontSize: 12,
    color: "#888",
  },
  stockInfoContainer: {
    marginBottom: 15,
  },
  inStock: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "500",
  },
  outOfStock: {
    fontSize: 14,
    color: "#F44336",
    fontWeight: "500",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  quantityLabel: {
    fontSize: 16,
    color: "#333",
    marginRight: 15,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
  },
  quantityButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  quantityButtonDisabled: {
    opacity: 0.5,
  },
  quantityButtonText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2a9d8f",
  },
  quantityValue: {
    width: 168,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  addToCartButton: {
    backgroundColor: "#2a9d8f",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  addToCartButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  descriptionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: "#555",
  },
  reviewsContainer: {
    marginBottom: 20,
  },
  reviewItem: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  reviewText: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
  },
  emptyReviews: {
    padding: 15,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    alignItems: "center",
  },
  emptyReviewsText: {
    color: "#888",
    fontSize: 14,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 10,
    color: "#555",
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
  errorText: {
    color: "#e76f51",
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#2a9d8f",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  modalImageCounter: {
    color: "#fff",
    fontSize: 16,
  },
  modalImageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalImage: {
    width: width,
    height: height * 0.7,
  },
  modalPlaceholderImage: {
    width: width,
    height: height * 0.7,
    backgroundColor: "#222",
    justifyContent: "center",
    alignItems: "center",
  },
  modalNavigation: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
  },
  modalNavButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalNavButtonText: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "bold",
  },
});

export default ArtmatDetailScreen;