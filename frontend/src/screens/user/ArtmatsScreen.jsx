import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, Dimensions } from "react-native";
import { getArtmats } from "../../api/matApi"; // Updated import path for art materials

const { width } = Dimensions.get("window");
const cardWidth = (width - 48) / 2; // 2 cards per row with margins

const ArtmatsScreen = ({ navigation }) => {
  const [artmats, setArtmats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [listKey, setListKey] = useState("grid");

  useEffect(() => {
    fetchArtmats();
  }, []);

  const fetchArtmats = async () => {
    try {
      setLoading(true);
      const response = await getArtmats();
      
      // Extract the artmats array and log the first item's images structure
      const artmatsData = response.artmats || [];
      if (artmatsData.length > 0) {
        console.log("First artmat images:", JSON.stringify(artmatsData[0].images));
      }
      
      setArtmats(artmatsData);
      setError(null);
    } catch (err) {
      console.error("Error details:", JSON.stringify(err, null, 2));
      console.error("Error message:", err.message);
      setError(err.message || "Failed to load art materials");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get image URI - adapted for the artmat model's image structure
  const getImageUri = (artmat) => {
    if (!artmat.images || artmat.images.length === 0) return null;
    
    // Based on the model schema, images are objects with url property
    return artmat.images[0].url;
  };

  const formatPrice = (price) => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const renderArtmat = ({ item }) => {
    const imageUri = getImageUri(item);
    
    return (
      <TouchableOpacity 
        style={styles.artmatCard}
        onPress={() => navigation.navigate('ArtmatDetail', { id: item._id })}
        activeOpacity={0.8}
      >
        <View style={styles.imageContainer}>
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
        </View>
        
        <View style={styles.artmatInfo}>
          <Text style={styles.artmatTitle} numberOfLines={1} ellipsizeMode="tail">
            {item.name}
          </Text>
          <Text style={styles.artmatCategory} numberOfLines={1} ellipsizeMode="tail">
            {item.category}
          </Text>
          <View style={styles.infoRow}>
            <Text style={styles.artmatPrice}>${formatPrice(item.price)}</Text>
            <Text style={styles.stockText}>Stock: {item.stock}</Text>
          </View>
          {item.ratings > 0 && (
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingText}>★ {item.ratings}</Text>
              <Text style={styles.reviewCount}>({item.numOfReviews} reviews)</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#2a9d8f" />
          <Text style={styles.loadingText}>Loading art materials...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchArtmats}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : artmats.length === 0 ? (
        <Text style={styles.noArtmatsText}>No art materials available</Text>
      ) : (
        <FlatList
          key={listKey}
          data={artmats}
          renderItem={renderArtmat}
          keyExtractor={(item) => item._id.toString()}
          showsVerticalScrollIndicator={false}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContainer}
          refreshing={loading}
          onRefresh={fetchArtmats}
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
  artmatCard: {
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
    fontSize: 14,
    fontWeight: "bold",
  },
  artmatInfo: {
    padding: 12,
  },
  artmatTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#333",
  },
  artmatCategory: {
    fontSize: 12,
    color: "#888",
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  artmatPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2a9d8f",
  },
  stockText: {
    fontSize: 12,
    color: "#666",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontSize: 12,
    color: "#f9a825",
    fontWeight: "bold",
    marginRight: 4,
  },
  reviewCount: {
    fontSize: 10,
    color: "#888",
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
  noArtmatsText: {
    textAlign: "center",
    fontSize: 16,
    color: "#666",
    marginTop: 40,
  },
});

export default ArtmatsScreen;