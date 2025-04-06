import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Alert
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { setArtworks, setLoading as setArtworksLoading, setError as setArtworksError } from "../../redux/artSlice";
import { setArtmats, setLoading as setArtmatsLoading, setError as setArtmatsError } from "../../redux/matSlice";
import { getArtworks } from "../../api/artApi";
import { getArtmats } from "../../api/matApi";

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2; // accounting for padding and gap

const HomeScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const {
    artworks,
    loading: artworksLoading,
    error: artworksError
  } = useSelector((state) => state.artworks);
  const {
    artmats,
    loading: artmatsLoading,
    error: artmatsError
  } = useSelector((state) => state.artmats);
  
  // Add network status state
  const [networkError, setNetworkError] = useState(false);

  // Fetch data when component mounts
  useEffect(() => {
    const fetchData = async () => {
      setNetworkError(false);
      
      // Fetch artworks
      dispatch(setArtworksLoading(true));
      try {
        const artworksData = await getArtworks();
        
        // Ensure artworks is an array
        const artworksArray = artworksData?.artworks || [];
        dispatch(setArtworks(artworksArray));
        dispatch(setArtworksError(null));
      } catch (error) {
        console.error("Error fetching artworks:", error);
        
        // Check if it's a network error
        if (error.message && error.message.includes("Network")) {
          setNetworkError(true);
        }
        
        dispatch(setArtworksError(error.message || "Failed to fetch artworks"));
      } finally {
        dispatch(setArtworksLoading(false));
      }
      
      // Fetch art materials
      dispatch(setArtmatsLoading(true));
      try {
        const artmatsData = await getArtmats();
        
        // Ensure artmats is an array
        const artmatsArray = artmatsData?.artmats || [];
        dispatch(setArtmats(artmatsArray));
        dispatch(setArtmatsError(null));
      } catch (error) {
        console.error("Error fetching art materials:", error);
        
        // Check if it's a network error
        if (error.message && error.message.includes("Network")) {
          setNetworkError(true);
        }
        
        dispatch(setArtmatsError(error.message || "Failed to fetch art materials"));
      } finally {
        dispatch(setArtmatsLoading(false));
      }
    };
    
    fetchData();
  }, [dispatch]);

  const getImageUri = (item) => {
    if (!item) return null;
    if (!item.images) return null;
    
    try {
      if (Array.isArray(item.images) && item.images.length > 0) {
        const firstImage = item.images[0];
        if (typeof firstImage === 'string') return firstImage;
        if (typeof firstImage === 'object' && firstImage.url) return firstImage.url;
        if (typeof firstImage === 'object' && firstImage.secure_url) return firstImage.secure_url;
      }
    } catch (error) {
      console.error("Error processing image:", error);
    }
    
    // Default placeholder
    return 'https://via.placeholder.com/400x200?text=No+Image';
  };

  const renderItem = ({ item, type }) => {
    if (!item) return null;
    
    const imageUri = getImageUri(item);
    const cardStyle = type === 'artwork' ? styles.artworkCard : styles.artmatCard;
    const imageStyle = type === 'artwork' ? styles.artworkImage : styles.artmatImage;
    const titleStyle = type === 'artwork' ? styles.artworkTitle : styles.artmatTitle;
    const screenName = type === 'artwork' ? 'ArtworkDetailScreen' : 'ArtmatDetailScreen';
    
    // Get artist name safely
    const artistName = type === 'artwork' ? 
      (typeof item.artist === 'object' ? item.artist.name : item.artist) || "Unknown Artist" : 
      null;
    
    // Get title safely
    const title = type === 'artwork' ? item.title : item.name;
 
    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={() => navigation.navigate('Shop', { 
          screen: screenName,
          params: { id: item._id }
        })}
        activeOpacity={0.7}
      >
        {imageUri ? (
          <Image 
            source={{ uri: imageUri }} 
            style={imageStyle}
            resizeMode="cover"
            onError={(e) => console.error("Image loading error:", e.nativeEvent.error)}
          />
        ) : (
          <View style={[imageStyle, styles.placeholderImage]}>
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}
        <View style={styles.cardContent}>
          <Text style={titleStyle} numberOfLines={1}>{title || (type === 'artwork' ? "Untitled Artwork" : "Unnamed Material")}</Text>
          {artistName && (
            <Text style={styles.artistText} numberOfLines={1}>
              By {artistName}
            </Text>
          )}
          <Text style={styles.priceText}>
            ${typeof item.price === 'number' ? item.price.toLocaleString() : 'N/A'}
          </Text>
          {item.status && (
            <View style={[styles.statusBadge, item.status === 'sold' ? styles.soldBadge : styles.availableBadge]}>
              <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };
 
  const isLoading = artworksLoading || artmatsLoading;
  const hasError = artworksError || artmatsError;
  const error = artworksError || artmatsError;
  
  // Check if we have data to render
  const hasArtworks = Array.isArray(artworks) && artworks.length > 0;
  const hasArtmats = Array.isArray(artmats) && artmats.length > 0;
  const noData = !hasArtworks && !hasArtmats && !isLoading && !hasError;

  const renderHorizontalList = (data, type, title) => {
    const isDataAvailable = Array.isArray(data) && data.length > 0;
    
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate(type === 'artwork' ? 'ArtworksScreen' : 'ArtmatsScreen')}
          >
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
       
        {isDataAvailable ? (
          <FlatList
            data={data}
            renderItem={(props) => renderItem({ ...props, type })}
            keyExtractor={(item) => item && item._id ? `${type}-${item._id}` : `${type}-${Math.random()}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalListContent}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No {title.toLowerCase()} available</Text>
          </View>
        )}
      </View>
    );
  };

  // Function to handle retry
  const handleRetry = () => {
    // Re-fetch data
    const fetchData = async () => {
      setNetworkError(false);
      dispatch(setArtworksLoading(true));
      dispatch(setArtmatsLoading(true));
      
      try {
        const artworksData = await getArtworks();
        // Ensure we're using the artworks array from the response
        const artworksArray = artworksData?.artworks || [];
        dispatch(setArtworks(artworksArray));
        dispatch(setArtworksError(null));
      } catch (error) {
        console.error("Error fetching artworks:", error);
        if (error.message && error.message.includes("Network")) {
          setNetworkError(true);
        }
        dispatch(setArtworksError(error.message || "Failed to fetch artworks"));
      } finally {
        dispatch(setArtworksLoading(false));
      }
      
      try {
        const artmatsData = await getArtmats();
        // Ensure we're using the artmats array from the response
        const artmatsArray = artmatsData?.artmats || [];
        dispatch(setArtmats(artmatsArray));
        dispatch(setArtmatsError(null));
      } catch (error) {
        console.error("Error fetching art materials:", error);
        if (error.message && error.message.includes("Network")) {
          setNetworkError(true);
        }
        dispatch(setArtmatsError(error.message || "Failed to fetch art materials"));
      } finally {
        dispatch(setArtmatsLoading(false));
      }
    };
    
    fetchData();
  };

  // Render a message when there's no data at all
  const renderNoDataMessage = () => (
    <View style={styles.noDataContainer}>
      <Text style={styles.noDataText}>No art or materials data available.</Text>
      <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
        <Text style={styles.retryButtonText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#2a9d8f" barStyle="light-content" />
     
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome, {user?.name || 'Artist'}!</Text>
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2a9d8f" />
          <Text style={styles.loadingText}>Loading your art content...</Text>
        </View>
      ) : hasError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
          {networkError && (
            <Text style={styles.networkErrorText}>
              Please check your internet connection and API server status.
            </Text>
          )}
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : noData ? (
        renderNoDataMessage()
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Featured Section */}
          <View style={styles.featuredContainer}>
            <Text style={styles.featuredTitle}>Featured Art</Text>
            {hasArtworks ? (
              <TouchableOpacity
                style={styles.featuredCard}
                onPress={() => navigation.navigate('Shop', { 
                  screen: 'ArtworkDetailScreen',
                  params: { id: artworks[0]._id }
                })}
                activeOpacity={0.9}
              >
                <Image
                  source={{ uri: getImageUri(artworks[0]) || 'https://via.placeholder.com/400x200?text=No+Image' }}
                  style={styles.featuredImage}
                  resizeMode="cover"
                  onError={(e) => console.error("Featured image loading error:", e.nativeEvent.error)}
                />
                <View style={styles.featuredOverlay}>
                  <Text style={styles.featuredCardTitle}>{artworks[0]?.title || "Untitled Artwork"}</Text>
                  <Text style={styles.featuredCardArtist}>
                    By {(typeof artworks[0]?.artist === 'object' ? artworks[0]?.artist?.name : artworks[0]?.artist) || "Unknown Artist"}
                  </Text>
                  {artworks[0]?.status && (
                    <View style={[styles.statusBadgeFeatured, 
                      artworks[0].status === 'sold' ? styles.soldBadge : styles.availableBadge]}>
                      <Text style={styles.statusTextFeatured}>{artworks[0].status.toUpperCase()}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ) : (
              <View style={[styles.featuredCard, styles.emptyFeatured]}>
                <Text style={styles.emptyText}>No featured artwork available</Text>
              </View>
            )}
          </View>
          
          {/* Artworks Section */}
          {renderHorizontalList(artworks, 'artwork', 'Artworks')}
          
          {/* Art Materials Section */}
          {renderHorizontalList(artmats, 'artmat', 'Art Materials')}
          
          {/* Categories Section */}
          <View style={styles.categoriesContainer}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <View style={styles.categoriesGrid}>
              {['Paintings', 'Sculptures', 'Digital Art', 'Photography'].map((category, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.categoryCard}
                >
                  <Text style={styles.categoryText}>{category}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  header: {
    backgroundColor: "#2a9d8f",
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#e63946",
    textAlign: "center",
    marginBottom: 10,
  },
  networkErrorText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#2a9d8f",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  noDataContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  noDataText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  featuredContainer: {
    padding: 16,
  },
  featuredTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#264653",
  },
  featuredCard: {
    width: "100%",
    height: 200,
    borderRadius: 15,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  featuredImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  featuredOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 15,
  },
  featuredCardTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  featuredCardArtist: {
    color: "#e9c46a",
    fontSize: 14,
    marginTop: 4,
  },
  emptyFeatured: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },
  section: {
    marginVertical: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#264653",
  },
  viewAllText: {
    color: "#2a9d8f",
    fontWeight: "bold",
  },
  horizontalListContent: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  artworkCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    marginRight: 12,
    width: cardWidth,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  artmatCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    marginRight: 12,
    width: cardWidth,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    borderColor: "#2a9d8f",
    borderWidth: 1,
  },
  artworkImage: {
    width: "100%",
    height: 150,
    resizeMode: "cover",
  },
  artmatImage: {
    width: "100%",
    height: 150,
    resizeMode: "cover",
  },
  cardContent: {
    padding: 12,
  },
  artworkTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#264653",
  },
  artmatTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2a9d8f",
  },
  artistText: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  priceText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#e76f51",
    marginTop: 4,
  },
  placeholderImage: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },
  placeholderText: {
    color: "#666",
    fontSize: 14,
  },
  emptyContainer: {
    width: cardWidth * 2,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    marginLeft: 16,
  },
  emptyText: {
    color: "#666",
    fontSize: 14,
    textAlign: "center",
  },
  categoriesContainer: {
    padding: 16,
    marginTop: 10,
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 10,
  },
  categoryCard: {
    width: "48%",
    height: 80,
    backgroundColor: "#f7cb9e",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  categoryText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#264653",
  },
  statusBadge: {
    position: "absolute",
    top: -30,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeFeatured: {
    position: "absolute",
    top: 0,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  soldBadge: {
    backgroundColor: "#e63946",
  },
  availableBadge: {
    backgroundColor: "#2a9d8f",
  },
  statusText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  statusTextFeatured: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
});

export default HomeScreen;