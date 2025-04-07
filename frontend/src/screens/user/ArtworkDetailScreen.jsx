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
import { addArtworkToCart } from "../../utils/cart"; 
import { getSingleArtwork } from "../../api/artApi";
import { setSelectedArtwork, setLoading, setError } from "../../redux/artSlice";
const { width, height } = Dimensions.get("window");

const ArtworkDetailScreen = ({ route, navigation }) => {
  const { id } = route.params;
  const dispatch = useDispatch();
  
  // Get data from Redux store
  const artwork = useSelector(state => state.artworks.selectedArtwork);
  const loading = useSelector(state => state.artworks.loading);
  const error = useSelector(state => state.artworks.error);
  const userId = useSelector(state => state.auth.user?._id || state.auth.user?.id);
  
  // Local component state for UI features
  const [imageIndex, setImageIndex] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchArtworkDetails();
    
    // Set navigation options dynamically when artwork loads
    if (artwork) {
      navigation.setOptions({
        headerTitle: artwork.title,
      });
    }
  }, [artwork?.title]);

  const fetchArtworkDetails = async () => {
    try {
      dispatch(setLoading(true));
      const response = await getSingleArtwork(id);
      dispatch(setSelectedArtwork(response.artwork));
      dispatch(setError(null));
    } catch (err) {
      console.error("Error details:", JSON.stringify(err, null, 2));
      dispatch(setError(err.message || "Failed to load artwork details"));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const getImageUri = (artwork) => {
    if (!artwork?.images) return null;
    
    if (Array.isArray(artwork.images) && artwork.images.length > 0) {
      if (typeof artwork.images[imageIndex] === 'string') {
        return artwork.images[imageIndex];
      }
      
      if (typeof artwork.images[imageIndex] === 'object' && artwork.images[imageIndex]?.url) {
        return artwork.images[imageIndex].url;
      }
    }
    
    return null;
  };

  const formatPrice = (price) => {
    if (!price) return "0";
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const handleNextImage = () => {
    if (artwork && artwork.images && imageIndex < artwork.images.length - 1) {
      setImageIndex(imageIndex + 1);
    }
  };

  const handlePrevImage = () => {
    if (imageIndex > 0) {
      setImageIndex(imageIndex - 1);
    }
  };

  const handleAddToCart = async () => {
    try {
      // Check if user is logged in
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
      
      // Check if artwork is valid and has an id
      if (!artwork || (!artwork.id && !artwork._id)) {
        console.error('Invalid artwork object:', artwork);
        Alert.alert(
          "Error",
          "Cannot add this artwork to cart: Missing artwork ID.",
          [{ text: "OK" }]
        );
        return;
      }
      
      // Clone artwork and ensure it has an id property
      const artworkWithId = {
        ...artwork,
        id: artwork.id || artwork._id // Use existing id or _id as fallback
      };
      
      // Log the artwork being added for debugging
      console.log('Adding artwork to cart:', JSON.stringify(artworkWithId));
      console.log('User ID:', userId);
      
      // Add artwork to cart with user ID
      const result = await addArtworkToCart(artworkWithId, userId);
      
      if (result.success) {
        Alert.alert(
          "Added to Cart",
          `"${artworkWithId.title}" has been added to your cart.`,
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

  const renderStatusBadge = (status) => {
    let badgeStyle = styles.statusBadge;
    let textStyle = styles.statusText;
    
    switch(status?.toLowerCase()) {
      case 'available':
        badgeStyle = {...badgeStyle, backgroundColor: '#4CAF50'};
        break;
      case 'sold':
        badgeStyle = {...badgeStyle, backgroundColor: '#F44336'};
        break;
      case 'reserved':
        badgeStyle = {...badgeStyle, backgroundColor: '#FF9800'};
        break;
      case 'on sale':
        badgeStyle = {...badgeStyle, backgroundColor: '#2196F3'};
        break;
      default:
        badgeStyle = {...badgeStyle, backgroundColor: '#9E9E9E'};
    }
    
    return (
      <View style={badgeStyle}>
        <Text style={textStyle}>{status || 'Unknown'}</Text>
      </View>
    );
  };

  const renderImageNavigation = () => {
    if (!artwork || !artwork.images || artwork.images.length <= 1) return null;
    
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
          {imageIndex + 1} / {artwork.images.length}
        </Text>
        
        <TouchableOpacity 
          style={[styles.navButton, imageIndex === artwork.images.length - 1 && styles.navButtonDisabled]}
          onPress={handleNextImage}
          disabled={imageIndex === artwork.images.length - 1}
        >
          <Text style={styles.navButtonText}>›</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderImageViewer = () => {
    if (!artwork || !artwork.images) return null;
    
    const imageUri = getImageUri(artwork);
    
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
              {imageIndex + 1} / {artwork.images.length}
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
          
          {artwork.images.length > 1 && (
            <View style={styles.modalNavigation}>
              <TouchableOpacity
                style={[styles.modalNavButton, imageIndex === 0 && styles.navButtonDisabled]}
                onPress={handlePrevImage}
                disabled={imageIndex === 0}
              >
                <Text style={styles.modalNavButtonText}>‹</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalNavButton, imageIndex === artwork.images.length - 1 && styles.navButtonDisabled]}
                onPress={handleNextImage}
                disabled={imageIndex === artwork.images.length - 1}
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
    if (!artwork || !artwork.images || artwork.images.length <= 1) return null;
    
    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.thumbnailsContainer}
      >
        {artwork.images.map((image, index) => {
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
    if (!artwork || !artwork.reviews || artwork.reviews.length === 0) {
      return (
        <View style={styles.emptyReviews}>
          <Text style={styles.emptyReviewsText}>No reviews yet</Text>
        </View>
      );
    }
    return artwork.reviews.map((review, index) => (
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
        <Text style={styles.loadingText}>Loading artwork details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchArtworkDetails}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!artwork) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <Text style={styles.errorText}>Artwork not found</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const imageUri = getImageUri(artwork);
  const isAvailable = artwork.status?.toLowerCase() === 'available' || 
                     artwork.status?.toLowerCase() === 'on sale';

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
              style={styles.artworkImage} 
              resizeMode="cover" 
            />
          ) : (
            <View style={[styles.artworkImage, styles.placeholderImage]}>
              <Text style={styles.placeholderText}>No Image</Text>
            </View>
          )}
          {renderImageNavigation()}
          {artwork.status && (
            <View style={styles.statusBadgeContainer}>
              {renderStatusBadge(artwork.status)}
            </View>
          )}
        </TouchableOpacity>
        
        {renderThumbnails()}
        
        <View style={styles.detailsContainer}>
          <Text style={styles.title}>{artwork.title}</Text>
          <Text style={styles.artist}>By {artwork.artist}</Text>
          <Text style={styles.category}>{artwork.category}</Text>
          
          <View style={styles.priceRatingContainer}>
            <Text style={styles.price}>₱{formatPrice(artwork.price)}</Text>
            {artwork.ratings > 0 && (
              <View style={styles.ratingContainer}>
                <Text style={styles.ratingText}>★ {artwork.ratings}</Text>
              </View>
            )}
          </View>
          
          <TouchableOpacity 
            style={[styles.addToCartButton, !isAvailable && styles.disabledButton]} 
            onPress={handleAddToCart}
            disabled={!isAvailable}
          >
            <Text style={styles.addToCartButtonText}>
              {isAvailable ? 'Add to Cart' : 'Not Available'}
            </Text>
          </TouchableOpacity>
          
          <View style={styles.descriptionContainer}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{artwork.description || "No description available."}</Text>
          </View>
          
          {artwork.dimensions && (
            <View style={styles.dimensionsContainer}>
              <Text style={styles.sectionTitle}>Dimensions</Text>
              <View style={styles.dimensionsCard}>
                <Text style={styles.dimensions}>
                  <Text style={styles.dimensionLabel}>Height:</Text> {artwork.dimensions.height} {artwork.dimensions.unit || "cm"}
                </Text>
                <Text style={styles.dimensions}>
                  <Text style={styles.dimensionLabel}>Width:</Text> {artwork.dimensions.width} {artwork.dimensions.unit || "cm"}
                </Text>
                {artwork.dimensions.depth && (
                  <Text style={styles.dimensions}>
                    <Text style={styles.dimensionLabel}>Depth:</Text> {artwork.dimensions.depth} {artwork.dimensions.unit || "cm"}
                  </Text>
                )}
                {artwork.dimensions.weight && (
                  <Text style={styles.dimensions}>
                    <Text style={styles.dimensionLabel}>Weight:</Text> {artwork.dimensions.weight} {artwork.dimensions.weightUnit || "kg"}
                  </Text>
                )}
              </View>
            </View>
          )}
          
          {artwork.materials && (
            <View style={styles.materialsContainer}>
              <Text style={styles.sectionTitle}>Materials</Text>
              <Text style={styles.materialsText}>{artwork.materials}</Text>
            </View>
          )}
          
          {artwork.yearCreated && (
            <View style={styles.yearContainer}>
              <Text style={styles.sectionTitle}>Year Created</Text>
              <Text style={styles.yearText}>{artwork.yearCreated}</Text>
            </View>
          )}
          
          <View style={styles.reviewsContainer}>
            <Text style={styles.sectionTitle}>Reviews</Text>
            {renderReviews()}
          </View>
        </View>
      </ScrollView>
      
      {/* Fullscreen Image Viewer Modal */}
      {renderImageViewer()}
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#2a9d8f',
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  imageContainer: {
    width: '100%',
    height: width * 0.8,
    position: 'relative',
  },
  artworkImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: '#666666',
  },
  imageNavigation: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: -3,
  },
  imageCounter: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    color: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    overflow: 'hidden',
    fontSize: 12,
  },
  statusBadgeContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    overflow: 'hidden',
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  thumbnailsContainer: {
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  thumbnail: {
    width: 60,
    height: 60,
    marginRight: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  thumbnailActive: {
    borderColor: '#2a9d8f',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailPlaceholderText: {
    fontSize: 20,
    color: '#666666',
  },
  detailsContainer: {
    padding: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 5,
  },
  artist: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 5,
  },
  category: {
    fontSize: 14,
    color: '#2a9d8f',
    marginBottom: 10,
  },
  priceRatingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  price: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333333',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 16,
    color: '#f9a825',
    fontWeight: '600',
  },
  addToCartButton: {
    backgroundColor: '#2a9d8f',
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  addToCartButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
    marginTop: 10,
  },
  descriptionContainer: {
    marginBottom: 15,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: '#666666',
  },
  dimensionsContainer: {
    marginBottom: 15,
  },
  dimensionsCard: {
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 5,
  },
  dimensions: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 5,
  },
  dimensionLabel: {
    fontWeight: '600',
    color: '#444444',
  },
  materialsContainer: {
    marginBottom: 15,
  },
  materialsText: {
    fontSize: 14,
    color: '#666666',
  },
  yearContainer: {
    marginBottom: 15,
  },
  yearText: {
    fontSize: 14,
    color: '#666666',
  },
  reviewsContainer: {
    marginBottom: 20,
  },
  reviewItem: {
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 5,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444444',
  },
  reviewText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  emptyReviews: {
    padding: 15,
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
  },
  emptyReviewsText: {
    fontSize: 14,
    color: '#999999',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(100, 100, 100, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalImageCounter: {
    color: '#ffffff',
    fontSize: 14,
  },
  modalImageContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  modalPlaceholderImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalNavigation: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  modalNavButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(100, 100, 100, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalNavButtonText: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: 'bold',
    marginTop: -3,
  }
});

export default ArtworkDetailScreen;