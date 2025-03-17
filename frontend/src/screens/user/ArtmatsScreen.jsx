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
import { getArtmats } from "../../api/matApi";

const { width } = Dimensions.get("window");
const cardWidth = (width - 48) / 2;

const ArtmatsScreen = ({ navigation }) => {
  const [artmats, setArtmats] = useState([]);
  const [filteredArtmats, setFilteredArtmats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [listKey, setListKey] = useState("grid");
  
  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100000 });
  const [tempPriceRange, setTempPriceRange] = useState({ min: 0, max: 100000 });
  const [stockFilter, setStockFilter] = useState("all"); // "all", "inStock", "outOfStock"
  const [tempStockFilter, setTempStockFilter] = useState("all");
  const [filtersApplied, setFiltersApplied] = useState(false);

  useEffect(() => {
    fetchArtmats();
  }, []);

  // Apply search and filters whenever relevant state changes
  useEffect(() => {
    applyFilters();
  }, [searchQuery, selectedCategory, priceRange, stockFilter, artmats]);

  const fetchArtmats = async () => {
    try {
      setLoading(true);
      const response = await getArtmats();
      
      const artmatsData = response.artmats || [];
      setArtmats(artmatsData);
      setFilteredArtmats(artmatsData);
      
      // Extract unique categories for filter
      if (artmatsData.length > 0) {
        const uniqueCategories = ["All", ...new Set(artmatsData.map(item => item.category))];
        setCategories(uniqueCategories);
        
        // Find max price for range slider default
        const maxPrice = Math.max(...artmatsData.map(item => item.price), 100000);
        setPriceRange({ min: 0, max: maxPrice });
        setTempPriceRange({ min: 0, max: maxPrice });
      }
      
      setError(null);
    } catch (err) {
      console.error("Error details:", JSON.stringify(err, null, 2));
      setError(err.message || "Failed to load art materials");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let results = [...artmats];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(item => 
        item.name.toLowerCase().includes(query) || 
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
    
    // Apply stock filter
    if (stockFilter === "inStock") {
      results = results.filter(item => item.stock > 0);
    } else if (stockFilter === "outOfStock") {
      results = results.filter(item => item.stock === 0);
    }
    
    setFilteredArtmats(results);
    setFiltersApplied(
      searchQuery !== "" || 
      selectedCategory !== "All" || 
      priceRange.min > 0 || 
      priceRange.max < 100000 ||
      stockFilter !== "all"
    );
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All");
    const maxPrice = Math.max(...artmats.map(item => item.price), 100000);
    setPriceRange({ min: 0, max: maxPrice });
    setTempPriceRange({ min: 0, max: maxPrice });
    setStockFilter("all");
    setTempStockFilter("all");
    setFiltersApplied(false);
  };

  const handleApplyFilters = () => {
    setPriceRange(tempPriceRange);
    setStockFilter(tempStockFilter);
    setFilterModalVisible(false);
  };

  // Helper function to get image URI
  const getImageUri = (artmat) => {
    if (!artmat.images || artmat.images.length === 0) return null;
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
        onPress={() => navigation.navigate('ArtmatDetailScreen', { id: item._id })}
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
            <Text style={[
              styles.stockText, 
              item.stock > 0 ? styles.inStockText : styles.outOfStockText
            ]}>
              {item.stock > 0 ? `Stock: ${item.stock}` : "Out of stock"}
            </Text>
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

  const renderStockFilterOption = (option, label) => {
    const isSelected = tempStockFilter === option;
    
    return (
      <TouchableOpacity
        key={option}
        style={[
          styles.stockFilterOption,
          isSelected && styles.selectedStockFilterOption
        ]}
        onPress={() => setTempStockFilter(option)}
      >
        <Text 
          style={[
            styles.stockFilterOptionText,
            isSelected && styles.selectedStockFilterOptionText
          ]}
        >
          {label}
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
            placeholder="Search art materials..."
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
            Filters applied: {filteredArtmats.length} results
          </Text>
          <TouchableOpacity
            style={styles.resetFiltersButton}
            onPress={resetFilters}
          >
            <Text style={styles.resetFiltersButtonText}>Reset All</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Art Materials List */}
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
      ) : filteredArtmats.length === 0 ? (
        <View style={styles.noResultsContainer}>
          <Text style={styles.noResultsText}>No art materials match your search</Text>
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
          data={filteredArtmats}
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
              <Text style={styles.modalTitle}>Filter Art Materials</Text>
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
                <Text style={styles.priceInputLabel}>Min ($)</Text>
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
                <Text style={styles.priceInputLabel}>Max ($)</Text>
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
            
            <Text style={styles.filterSectionTitle}>Stock</Text>
            <View style={styles.stockFilterContainer}>
              {renderStockFilterOption("all", "All Items")}
              {renderStockFilterOption("inStock", "In Stock")}
              {renderStockFilterOption("outOfStock", "Out of Stock")}
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
  // Base container styles
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
  
  // Card styles
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
  inStockText: {
    color: "#2a9d8f",
  },
  outOfStockText: {
    color: "#e63946",
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
  stockFilterContainer: {
    flexDirection: "row",
    marginBottom: 24,
  },
  stockFilterOption: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginRight: 8,
  },
  selectedStockFilterOption: {
    backgroundColor: "#2a9d8f",
  },
  stockFilterOptionText: {
    color: "#555",
    fontWeight: "500",
  },
  selectedStockFilterOptionText: {
    color: "white",
    fontWeight: "bold",
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

export default ArtmatsScreen;