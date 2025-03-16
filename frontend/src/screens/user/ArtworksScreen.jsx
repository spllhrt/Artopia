import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, Dimensions } from "react-native";
import { getArtworks } from "../../api/artApi"; // Keep your import path

const { width } = Dimensions.get("window");
const cardWidth = (width - 48) / 2; // 2 cards per row with margins

const ArtworksScreen = ({ navigation }) => {
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Add a key state to force re-render when needed
  const [listKey, setListKey] = useState("grid");

  useEffect(() => {
    fetchArtworks();
  }, []);

  const fetchArtworks = async () => {
    try {
      setLoading(true);
      const response = await getArtworks();
      
      // Extract the artworks array and log the first item's images structure
      const artworksData = response.artworks || [];
      if (artworksData.length > 0) {
        console.log("First artwork images:", JSON.stringify(artworksData[0].images));
      }
      
      setArtworks(artworksData);
      setError(null);
    } catch (err) {
      console.error("Error details:", JSON.stringify(err, null, 2));
      console.error("Error message:", err.message);
      setError(err.message || "Failed to load artworks");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get image URI
  const getImageUri = (artwork) => {
    if (!artwork.images) return null;
    
    // Check if images is an array of strings
    if (Array.isArray(artwork.images) && artwork.images.length > 0) {
      // If the first item is a string, use it directly
      if (typeof artwork.images[0] === 'string') {
        return artwork.images[0];
      }
      
      // If the first item is an object with a url property
      if (typeof artwork.images[0] === 'object' && artwork.images[0]?.url) {
        return artwork.images[0].url;
      }
    }
    
    return null;
  };

  const formatPrice = (price) => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const renderArtwork = ({ item }) => {
    const imageUri = getImageUri(item);
    
    return (
      <TouchableOpacity 
        style={styles.artworkCard}
        onPress={() => navigation.navigate('ArtworkDetail', { id: item._id })}
        activeOpacity={0.8}
      >
        <View style={styles.imageContainer}>
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
        </View>
        
        <View style={styles.artworkInfo}>
          <Text style={styles.artworkTitle} numberOfLines={1} ellipsizeMode="tail">
            {item.title}
          </Text>
          <Text style={styles.artworkArtist} numberOfLines={1} ellipsizeMode="tail">
            By {item.artist}
          </Text>
          <Text style={styles.artworkCategory} numberOfLines={1} ellipsizeMode="tail">
            {item.category}
          </Text>
          <View style={styles.priceContainer}>
            <Text style={styles.artworkPrice}>${formatPrice(item.price)}</Text>
            {item.ratings > 0 && (
              <View style={styles.ratingContainer}>
                <Text style={styles.ratingText}>★ {item.ratings}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#2a9d8f" />
          <Text style={styles.loadingText}>Loading artworks...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchArtworks}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : artworks.length === 0 ? (
        <Text style={styles.noArtworksText}>No artworks available</Text>
      ) : (
        <FlatList
          key={listKey}
          data={artworks}
          renderItem={renderArtwork}
          keyExtractor={(item) => item._id.toString()}
          showsVerticalScrollIndicator={false}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContainer}
          refreshing={loading}
          onRefresh={fetchArtworks}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
    color: "#333",
  },
  columnWrapper: {
    justifyContent: "space-between",
  },
  listContainer: {
    paddingBottom: 20,
  },
  artworkCard: {
    width: cardWidth,
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: "#fff",
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageContainer: {
    width: "100%",
    height: 180,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: "hidden",
  },
  artworkImage: {
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
    fontSize: 14,
    fontWeight: "bold",
  },
  artworkInfo: {
    padding: 12,
  },
  artworkTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#333",
  },
  artworkArtist: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  artworkCategory: {
    fontSize: 12,
    color: "#888",
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  artworkPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2a9d8f",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontSize: 12,
    color: "#f9a825",
    fontWeight: "bold",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    color: "#e63946",
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#2a9d8f",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  noArtworksText: {
    textAlign: "center",
    fontSize: 16,
    color: "#666",
    marginTop: 40,
  },
});

export default ArtworksScreen;