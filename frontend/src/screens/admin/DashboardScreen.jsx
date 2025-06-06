import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator,
  RefreshControl,
  Alert
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { getAllOrders, clearOrderErrors } from "../../api/orderApi";
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
  
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [orderError, setOrderError] = useState(null);
  const user = useSelector(state => state.auth.user);
  const dispatch = useDispatch();
  
  const [orderStats, setOrderStats] = useState({
    totalOrders: 0,
    totalSales: 0,
    processingOrders: 0,
    shippedOrders: 0
  });
  
  const loadOrders = async () => {
    try {
      setOrdersLoading(true);
      const response = await dispatch(getAllOrders());
      
      if (response && response.payload && response.payload.orders) {
        setOrders(response.payload.orders);
        
        // Calculate stats from orders
        const totalSales = response.payload.orders.reduce(
          (sum, order) => sum + (order.totalPrice || 0), 0
        );
        const processingOrders = response.payload.orders.filter(
          order => order.orderStatus === 'Processing'
        ).length;
        const shippedOrders = response.payload.orders.filter(
          order => order.orderStatus === 'Shipped'
        ).length;
        
        // Update state with calculated stats
        setOrderStats({
          totalSales,
          processingOrders,
          shippedOrders,
          totalOrders: response.payload.orders.length || 0
        });
      }
    } catch (error) {
      console.error("Dashboard orders fetch error:", error);
      setOrderError(error.message || "Failed to load orders");
    } finally {
      setOrdersLoading(false);
    }
  };
  
  const fetchData = async () => {
    try {
      setLoading(true);
      const [artworksData, materialsData] = await Promise.all([
        getAdminArtworks(),
        getAdminArtmats()
      ]);
      
      setArtworks(artworksData.artworks || []);
      setMaterials(materialsData.artmats || []);
      
      setCounts({
        artworksCount: artworksData.artworks?.length || 0,
        materialsCount: materialsData.artmats?.length || 0
      });
    } catch (error) {
      console.error("Dashboard data fetch error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        
        // Fetch all data in parallel
        const [artworksData, materialsData] = await Promise.all([
          getAdminArtworks(),
          getAdminArtmats()
        ]);
        
        setArtworks(artworksData.artworks || []);
        setMaterials(materialsData.artmats || []);
        
        setCounts({
          artworksCount: artworksData.artworks?.length || 0,
          materialsCount: materialsData.artmats?.length || 0
        });
        
        // Load orders separately (since it uses dispatch)
        await loadOrders();
        
      } catch (error) {
        console.error("Dashboard data fetch error:", error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };
    
    fetchAllData();
    
    // Handle order errors
    if (orderError) {
      Alert.alert('Error', orderError);
      setOrderError(null);
      dispatch(clearOrderErrors());
    }
  }, [orderError]);
  
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const [artworksData, materialsData] = await Promise.all([
        getAdminArtworks(),
        getAdminArtmats()
      ]);
      
      setArtworks(artworksData.artworks || []);
      setMaterials(materialsData.artmats || []);
      
      setCounts({
        artworksCount: artworksData.artworks?.length || 0,
        materialsCount: materialsData.artmats?.length || 0
      });
      
      // Refresh orders
      await loadOrders();
    } catch (error) {
      console.error("Dashboard refresh error:", error);
    } finally {
      setRefreshing(false);
    }
  };
  
  const StatCard = ({ title, value, icon, color }) => (
    <View style={[styles.statCard, { backgroundColor: 'white' }]}>
      <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );
  
  const ItemCard = ({ item, type, onPress }) => (
    <TouchableOpacity 
      style={styles.itemCard}
      onPress={onPress}
    >
      {item.images?.[0] && (
        <Image 
          source={{ uri: item.images[0].url }} 
          style={styles.itemImage} 
          resizeMode="cover"
        />
      )}
      <Text style={styles.itemTitle} numberOfLines={1}>
        {type === 'artwork' ? item.title || "Untitled" : item.name || "Unnamed"}
      </Text>
      <Text style={styles.itemSubtitle} numberOfLines={1}>
        {type === 'artwork' ? item.medium || "Mixed medium" : item.category || "Uncategorized"}
      </Text>
      {type === 'material' && (
        <Text style={styles.materialPrice}>
          ₱{item.price || "0"}
        </Text>
      )}
    </TouchableOpacity>
  );
  
  const OrderCard = ({ order, onPress }) => (
    <TouchableOpacity style={styles.itemCard} onPress={onPress}>
      <View style={styles.orderCardContent}>
        <Text style={styles.itemTitle} numberOfLines={1}>Order #{order._id?.substring(0, 8)}</Text>
        <Text style={styles.itemSubtitle} numberOfLines={1}>
          {order.orderStatus || "Processing"}
        </Text>
        <Text style={styles.materialPrice}>
          ₱{order.totalPrice?.toFixed(2) || "0.00"}
        </Text>
      </View>
    </TouchableOpacity>
  );
  
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
      
      {/* Stats Summary */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll}>
        <View style={styles.statsContainer}>
          <StatCard 
            title="Total Orders" 
            value={orderStats.totalOrders} 
            icon="document-text" 
            color="#4F46E5" 
          />
          <StatCard 
            title="Total Sales" 
            value={`₱${orderStats.totalSales.toFixed(2)}`} 
            icon="cash" 
            color="#10B981" 
          />
          <StatCard 
            title="Processing" 
            value={orderStats.processingOrders} 
            icon="time" 
            color="#F59E0B" 
          />
          <StatCard 
            title="Shipped" 
            value={orderStats.shippedOrders} 
            icon="bicycle" 
            color="#3B82F6" 
          />
        </View>
      </ScrollView>
      
      <View style={styles.statsRow}>
        <TouchableOpacity style={styles.statsCard} onPress={() => navigation.navigate("Artworks")}>
          <Ionicons name="image-outline" size={30} color="#0000ff" />
          <Text style={styles.statNumber}>{counts.artworksCount}</Text>
          <Text style={styles.statLabel}>Artworks</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.statsCard} onPress={() => navigation.navigate("Materials")}>
          <Ionicons name="color-palette-outline" size={30} color="#ff6b6b" />
          <Text style={styles.statNumber}>{counts.materialsCount}</Text>
          <Text style={styles.statLabel}>Materials</Text>
        </TouchableOpacity>
      </View>
      {/* Recent Orders */}
      <SectionHeader 
        title="Recent Orders" 
        onViewAll={() => navigation.navigate("Orders")} 
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {orders.length > 0 ? (
          orders.slice(0, 5).map((order, index) => (
            <OrderCard 
              key={order._id || index}
              order={order}
            />
          ))
        ) : (
          <EmptyState message="No orders found" />
        )}
      </ScrollView>
      {/* Recent Artworks */}
      <SectionHeader 
        title="Recent Artworks" 
        onViewAll={() => navigation.navigate("Artworks")} 
      />
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {artworks.length > 0 ? (
          artworks.slice(0, 5).map((artwork, index) => (
            <ItemCard 
              key={artwork._id || index}
              item={artwork}
              type="artwork"
            />
          ))
        ) : (
          <EmptyState message="No artworks found" />
        )}
      </ScrollView>
      
      {/* Art Materials */}
      <SectionHeader 
        title="Art Materials" 
        onViewAll={() => navigation.navigate("Materials")} 
      />
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {materials.length > 0 ? (
          materials.slice(0, 5).map((material, index) => (
            <ItemCard 
              key={material._id || index}
              item={material}
              type="material"
            />
          ))
        ) : (
          <EmptyState message="No materials found" />
        )}
      </ScrollView>
    </ScrollView>
  );
};

const SectionHeader = ({ title, onViewAll }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <TouchableOpacity onPress={onViewAll}>
      <Text style={styles.viewAll}>View All</Text>
    </TouchableOpacity>
  </View>
);

const EmptyState = ({ message }) => (
  <View style={styles.emptyState}>
    <Text>{message}</Text>
  </View>
);

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
  statsScroll: { 
    marginBottom: 10 
  },
  statsContainer: { 
    flexDirection: 'row', 
    paddingHorizontal: 15, 
    marginTop:10,
  },
  statCard: { 
    width: 110, 
    padding: 12, 
    marginRight: 12, 
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    height: 120
  },
  iconContainer: { 
    width: 36, 
    height: 36, 
    borderRadius: 8, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 2 
  },
  statValue: { 
    fontSize: 15, 
    fontWeight: 'bold', 
    color: '#111827' 
  },
  statTitle: { 
    color: '#6B7280', 
    fontSize: 13, 
    marginTop: 1 
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
  itemCard: {
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
    paddingBottom: 10,
  },
  itemImage: {
    width: 160,
    height: 160,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 10,
    marginHorizontal: 10,
    color: "#333",
  },
  itemSubtitle: {
    fontSize: 12,
    color: "#666",
    marginHorizontal: 10,
  },
  materialPrice: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#ff6b6b",
    marginHorizontal: 10,
  },
  emptyState: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    width: 200,
  },
  orderCardContent: {
    padding: 15,
  }
});

export default DashboardScreen;