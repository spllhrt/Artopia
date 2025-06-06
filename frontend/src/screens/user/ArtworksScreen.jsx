import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator, 
  Dimensions,
  TextInput,
  Modal,
  ScrollView
} from "react-native";
import { useSelector, useDispatch } from 'react-redux';
import { setArtworks, setLoading, setError } from '../../redux/artSlice';
import { getArtworks } from "../../api/artApi";

const { width } = Dimensions.get("window");
const cardWidth = (width - 48) / 2;

const ArtworksScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { artworks, loading, error } = useSelector(state => state.artworks);
  const [filteredArtworks, setFilteredArtworks] = useState([]);
  const [listKey, setListKey] = useState("grid");
  
  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100000 });
  const [tempPriceRange, setTempPriceRange] = useState({ min: 0, max: 100000 });
  const [filtersApplied, setFiltersApplied] = useState(false);

  useEffect(() => {
    fetchArtworks();
  }, []);

  // Apply search and filters whenever relevant state changes
  useEffect(() => {
    applyFilters();
  }, [searchQuery, selectedCategory, priceRange, artworks]);

  const fetchArtworks = async () => {
    try {
      dispatch(setLoading(true));
      const response = await getArtworks();
      
      const artworksData = response.artworks || [];
      dispatch(setArtworks(artworksData));
      setFilteredArtworks(artworksData);
      
      // Extract unique categories for filter
      if (artworksData.length > 0) {
        const uniqueCategories = ["All", ...new Set(artworksData.map(item => item.category))];
        setCategories(uniqueCategories);
        
        // Find max price for range slider default
        const maxPrice = Math.max(...artworksData.map(item => item.price), 100000);
        setPriceRange({ min: 0, max: maxPrice });
        setTempPriceRange({ min: 0, max: maxPrice });
      }
      
      dispatch(setError(null));
    } catch (err) {
      console.error("Error details:", JSON.stringify(err, null, 2));
      dispatch(setError(err.message || "Failed to load artworks"));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const applyFilters = () => {
    let results = [...artworks];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(item => 
        item.title.toLowerCase().includes(query) || 
        item.artist.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
      );
    }
    
    // Apply category filter
    if (selectedCategory !== "All") {
      results = results.filter(item => item.category === selectedCategory);
    }
    
    // Apply price range filter
    results = results.filter(item => 
      item.price >= priceRange.min && item.price <= priceRange.max
    );
    
    setFilteredArtworks(results);
    setFiltersApplied(searchQuery !== "" || selectedCategory !== "All" || 
      priceRange.min > 0 || priceRange.max < 100000);
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All");
    const maxPrice = Math.max(...artworks.map(item => item.price), 100000);
    setPriceRange({ min: 0, max: maxPrice });
    setTempPriceRange({ min: 0, max: maxPrice });
    setFiltersApplied(false);
  };

  const handleApplyFilters = () => {
    setPriceRange(tempPriceRange);
    setFilterModalVisible(false);
  };

  // Helper function to get image URI
  const getImageUri = (artwork) => {
    if (!artwork.images) return null;
    
    if (Array.isArray(artwork.images) && artwork.images.length > 0) {
      if (typeof artwork.images[0] === 'string') {
        return artwork.images[0];
      }
      
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
        onPress={() => navigation.navigate('ArtworkDetailScreen', { id: item._id })}
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
            <Text style={styles.artworkPrice}>₱{formatPrice(item.price)}</Text>
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

  const renderCategoryChip = (category) => {
    const isSelected = selectedCategory === category;
    
    return (
      <TouchableOpacity
        key={category}
        style={[
          styles.categoryChip,
          isSelected && styles.selectedCategoryChip
        ]}
        onPress={() => setSelectedCategory(category)}
      >
        <Text 
          style={[
            styles.categoryChipText,
            isSelected && styles.selectedCategoryChipText
          ]}
        >
          {category}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search and Filter Bar */}
      <View style={styles.searchFilterContainer}>
        <View style={styles.searchInputContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search artworks..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== "" && (
            <TouchableOpacity
              style={styles.clearSearchButton}
              onPress={() => setSearchQuery("")}
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setFilterModalVisible(true)}
        >
          <Text style={styles.filterButtonText}>Filter</Text>
        </TouchableOpacity>
      </View>
      
      {/* Category Horizontal Scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
      >
        {categories.map(category => renderCategoryChip(category))}
      </ScrollView>
      
      {/* Active Filters Indicator */}
      {filtersApplied && (
        <View style={styles.activeFiltersContainer}>
          <Text style={styles.activeFiltersText}>
            Filters applied: {filteredArtworks.length} results
          </Text>
          <TouchableOpacity
            style={styles.resetFiltersButton}
            onPress={resetFilters}
          >
            <Text style={styles.resetFiltersButtonText}>Reset All</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Artworks List */}
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
      ) : filteredArtworks.length === 0 ? (
        <View style={styles.noResultsContainer}>
          <Text style={styles.noResultsText}>No artworks match your search</Text>
          <TouchableOpacity
            style={styles.resetFiltersButton}
            onPress={resetFilters}
          >
            <Text style={styles.resetFiltersButtonText}>Reset Filters</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          key={listKey}
          data={filteredArtworks}
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
      
      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Artworks</Text>
              <TouchableOpacity
                onPress={() => setFilterModalVisible(false)}
              >
                <Text style={styles.closeModalText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.filterSectionTitle}>Category</Text>
            <View style={styles.modalCategoriesContainer}>
              {categories.map(category => renderCategoryChip(category))}
            </View>
            
            <Text style={styles.filterSectionTitle}>Price Range</Text>
            <View style={styles.priceRangeContainer}>
              <View style={styles.priceInputContainer}>
                <Text style={styles.priceInputLabel}>Min (₱)</Text>
                <TextInput
                  style={styles.priceInput}
                  value={tempPriceRange.min.toString()}
                  onChangeText={(text) => {
                    const value = parseInt(text) || 0;
                    setTempPriceRange(prev => ({ ...prev, min: value }));
                  }}
                  keyboardType="numeric"
                />
              </View>
              <Text style={styles.priceRangeSeparator}>to</Text>
              <View style={styles.priceInputContainer}>
                <Text style={styles.priceInputLabel}>Max (₱)</Text>
                <TextInput
                  style={styles.priceInput}
                  value={tempPriceRange.max.toString()}
                  onChangeText={(text) => {
                    const value = parseInt(text) || 0;
                    setTempPriceRange(prev => ({ ...prev, max: value }));
                  }}
                  keyboardType="numeric"
                />
              </View>
            </View>
            
            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity
                style={styles.resetFilterButton}
                onPress={resetFilters}
              >
                <Text style={styles.resetFilterButtonText}>Reset All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyFilterButton}
                onPress={handleApplyFilters}
              >
                <Text style={styles.applyFilterButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  // Existing styles
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
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
  
  // Search and filter styles
  searchFilterContainer: {
    flexDirection: "row",
    marginBottom: 2,
    alignItems: "center",
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: "#333",
  },
  clearSearchButton: {
    padding: 6,
  },
  clearButtonText: {
    fontSize: 16,
    color: "#888",
  },
  filterButton: {
    backgroundColor: "#2a9d8f",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  categoriesContainer: {
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center', 
  },
  categoryChip: {
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    height: 36, 
    justifyContent: 'center', 
    alignItems: 'center', 
  },
  selectedCategoryChip: {
    backgroundColor: "#2a9d8f",
  },
  categoryChipText: {
    color: "#555",
    fontWeight: "500",
  },
  selectedCategoryChipText: {
    color: "white",
    fontWeight: "bold",
  },
  activeFiltersContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    marginBottom: 8,
  },
  activeFiltersText: {
    fontSize: 14,
    color: "#555",
  },
  resetFiltersButton: {
    padding: 6,
  },
  resetFiltersButtonText: {
    color: "#e63946",
    fontWeight: "bold",
  },
  
  // Loading, error and empty states
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
  noResultsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noResultsText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 16,
  },
  
  
  // Filter modal styles
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  closeModalText: {
    fontSize: 20,
    color: "#888",
    padding: 5,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#555",
    marginBottom: 10,
    marginTop: 10,
  },
  modalCategoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  priceRangeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  priceInputContainer: {
    flex: 1,
  },
  priceInputLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  priceInput: {
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  priceRangeSeparator: {
    marginHorizontal: 12,
    color: "#666",
  },
  modalButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  resetFilterButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#2a9d8f",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginRight: 8,
  },
  resetFilterButtonText: {
    color: "#2a9d8f",
    fontWeight: "bold",
  },
  applyFilterButton: {
    flex: 1,
    backgroundColor: "#2a9d8f",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginLeft: 8,
  },
  applyFilterButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default ArtworksScreen;