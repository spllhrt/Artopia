import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator,
  RefreshControl 
} from "react-native";
import { useSelector } from "react-redux";
import { getAdminArtworks } from "../../api/artApi";
import { getAdminArtmats } from "../../api/matApi";
import { Ionicons } from "@expo/vector-icons";

const DashboardScreen = ({ navigation }) => {
  const [artworks, setArtworks] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [counts, setCounts] = useState({
    artworksCount: 0,
    materialsCount: 0
  });

  const user = useSelector((state) => state.auth.user);
  
  const fetchData = async () => {
    try {
      setLoading(true);
      const artworksData = await getAdminArtworks();
      const materialsData = await getAdminArtmats();
      
      setArtworks(artworksData.artworks || []);
      setMaterials(materialsData.artmats || []);
      
      setCounts({
        artworksCount: artworksData.artworks ? artworksData.artworks.length : 0,
        materialsCount: materialsData.artmats ? materialsData.artmats.length : 0
      });
      
    } catch (error) {
      console.error("Dashboard data fetch error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.headerSection}>
        <Text style={styles.welcomeText}>
          Welcome{user?.name ? `, ${user.name}` : ""}
        </Text>
        <Text style={styles.subTitle}>Dashboard Overview</Text>
      </View>

      <View style={styles.statsRow}>
        <TouchableOpacity 
          style={styles.statsCard}
          onPress={() => navigation.navigate("Artworks")}
        >
          <Ionicons name="image-outline" size={30} color="#0000ff" />
          <Text style={styles.statNumber}>{counts.artworksCount}</Text>
          <Text style={styles.statLabel}>Artworks</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.statsCard}
          onPress={() => navigation.navigate("Materials")}
        >
          <Ionicons name="color-palette-outline" size={30} color="#ff6b6b" />
          <Text style={styles.statNumber}>{counts.materialsCount}</Text>
          <Text style={styles.statLabel}>Materials</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Artworks</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Artworks")}>
          <Text style={styles.viewAll}>View All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {artworks && artworks.length > 0 ? (
          artworks.slice(0, 5).map((artwork, index) => (
            <TouchableOpacity 
              key={artwork._id || index} 
              style={styles.artworkCard}
              onPress={() => navigation.navigate("ArtworkDetail", { id: artwork._id })}
            >
              {artwork.images && artwork.images[0] && (
                <Image 
                  source={{ uri: artwork.images[0].url }} 
                  style={styles.artworkImage} 
                  resizeMode="cover"
                />
              )}
              <Text style={styles.artworkTitle} numberOfLines={1}>
                {artwork.title || "Untitled"}
              </Text>
              <Text style={styles.artworkSubtitle} numberOfLines={1}>
                {artwork.medium || "Mixed medium"}
              </Text>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text>No artworks found</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Art Materials</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Materials")}>
          <Text style={styles.viewAll}>View All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {materials && materials.length > 0 ? (
          materials.slice(0, 5).map((material, index) => (
            <TouchableOpacity 
              key={material._id || index} 
              style={styles.materialCard}
              onPress={() => navigation.navigate("MaterialDetail", { id: material._id })}
            >
              {material.images && material.images[0] && (
                <Image 
                  source={{ uri: material.images[0].url }} 
                  style={styles.materialImage}
                  resizeMode="cover"
                />
              )}
              <Text style={styles.materialTitle} numberOfLines={1}>
                {material.name || "Unnamed"}
              </Text>
              <Text style={styles.materialSubtitle} numberOfLines={1}>
                {material.category || "Uncategorized"}
              </Text>
              <Text style={styles.materialPrice}>
                ₱{material.price || "0"}
              </Text>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text>No materials found</Text>
          </View>
        )}
      </ScrollView>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerSection: {
    padding: 20,
    paddingTop: 40,
    backgroundColor: "#fff",
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },
  subTitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 5,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 15,
  },
  statsCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    width: "45%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 10,
    color: "#333",
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  viewAll: {
    color: "#0000ff",
    fontSize: 14,
  },
  artworkCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    marginLeft: 15,
    marginRight: 5,
    marginBottom: 15,
    width: 160,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  artworkImage: {
    width: 160,
    height: 160,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  artworkTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 10,
    marginHorizontal: 10,
    color: "#333",
  },
  artworkSubtitle: {
    fontSize: 12,
    color: "#666",
    marginHorizontal: 10,
    marginBottom: 10,
  },
  materialCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    marginLeft: 15,
    marginRight: 5,
    marginBottom: 15,
    width: 160,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  materialImage: {
    width: 160,
    height: 160,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  materialTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 10,
    marginHorizontal: 10,
    color: "#333",
  },
  materialSubtitle: {
    fontSize: 12,
    color: "#666",
    marginHorizontal: 10,
  },
  materialPrice: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#ff6b6b",
    marginHorizontal: 10,
    marginBottom: 10,
  },
  emptyState: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    width: 200,
  },
  actionSection: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 20,
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: "#0000ff",
    borderRadius: 10,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "45%",
  },
  actionButtonText: {
    color: "#fff",
    marginLeft: 8,
    fontWeight: "bold",
  }
});

export default DashboardScreen;