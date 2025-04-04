import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Alert,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { useSelector } from "react-redux";
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { 
  promoteArtwork, 
  promoteArtMaterial, 
  cleanupTokens 
} from "../../api/notificationApi";
import { getAdminArtworks } from "../../api/artApi";
import { getAdminArtmats } from "../../api/matApi";

const AdminPromotionScreen = () => {
  // State management
  const [promotionType, setPromotionType] = useState("artwork");
  const [artworkId, setArtworkId] = useState("");
  const [artmatId, setArtmatId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Data states
  const [artworks, setArtworks] = useState([]);
  const [artmats, setArtmaterials] = useState([]);
  const [loadingArtworks, setLoadingArtworks] = useState(false);
  const [loadingArtmaterials, setLoadingArtmaterials] = useState(false);
  
  // Auth states from Redux
  const token = useSelector(state => state.auth.token);
  const userRole = useSelector(state => state.auth.user?.role);
  
  // Check if user is admin
  useEffect(() => {
    if (userRole !== 'admin') {
      Alert.alert(
        "Access Denied", 
        "Only administrators can access this screen.",
        [{ text: "Go Back", style: "cancel" }]
      );
    }
  }, [userRole]);

  // Fetch relevant data based on selected promotion type
  useEffect(() => {
    if (promotionType === "artwork") {
      fetchArtworks();
    } else if (promotionType === "artmat") {
      fetchArtMaterials();
    }
  }, [promotionType]);
  
  const fetchArtworks = async () => {
    try {
      setLoadingArtworks(true);
      const response = await getAdminArtworks();
      setArtworks(response.artworks || []);
    } catch (error) {
      console.error("Failed to fetch artworks:", error);
      Alert.alert("Error", "Failed to load artwork list");
    } finally {
      setLoadingArtworks(false);
    }
  };
  
  const fetchArtMaterials = async () => {
    try {
      setLoadingArtmaterials(true);
      const response = await getAdminArtmats();
      setArtmaterials(response.artmats || []);
    } catch (error) {
      console.error("Failed to fetch art materials:", error);
      Alert.alert("Error", "Failed to load art materials list");
    } finally {
      setLoadingArtmaterials(false);
    }
  };
  
  const cleanupStalePushTokens = async () => {
    try {
      setIsLoading(true);
      const result = await cleanupTokens();
      
      const stats = result.stats || {};
      const totalRemoved = (stats.expired || 0) + (stats.invalidFormat || 0) + (stats.invalidToken || 0);
      
      Alert.alert(
        "Cleanup Complete", 
        `Invalid tokens removed: ${totalRemoved}\n\nDetails:\n- Expired: ${stats.expired || 0}\n- Invalid format: ${stats.invalidFormat || 0}\n- Invalid tokens: ${stats.invalidToken || 0}`
      );
      console.log("🧹 Token cleanup result:", result);
    } catch (error) {
      Alert.alert("Error", "Failed to clean up tokens.");
      console.error("❌ Token cleanup error:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const sendPromotion = async () => {
    // Validation based on promotion type
    if (promotionType === "artwork" && !artworkId) {
      Alert.alert("Error", "Please select an artwork.");
      return;
    } else if (promotionType === "artmat" && !artmatId) {
      Alert.alert("Error", "Please select an art material.");
      return;
    }
    
    try {
      setIsLoading(true);
      let response;
      
      switch (promotionType) {
        case "artwork":
          response = await promoteArtwork(artworkId);
          break;
          
        case "artmat":
          response = await promoteArtMaterial(artmatId);
          break;
          
        default:
          throw new Error("Invalid promotion type");
      }
      
      Alert.alert(
        "Success", 
        `Promotion sent to users!`
      );
      
      // Reset selection
      setArtworkId("");
      setArtmatId("");
    } catch (error) {
      console.error("❌ Failed to send promotion:", error);
      Alert.alert("Error", "Failed to send promotion. Check console for details.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Helper components
  const renderArtworkSelector = () => (
    <View style={styles.formSection}>
      <Text style={styles.sectionTitle}>Artwork Details</Text>
      {loadingArtworks ? (
        <ActivityIndicator size="small" color="#007AFF" style={styles.loader} />
      ) : (
        <>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={artworkId}
              onValueChange={setArtworkId}
              style={styles.picker}
            >
              <Picker.Item label="-- Select an Artwork --" value="" />
              {artworks.map(artwork => (
                <Picker.Item 
                  key={artwork._id} 
                  label={`${artwork.title} by ${artwork.artist}`} 
                  value={artwork._id} 
                />
              ))}
            </Picker>
          </View>
          
          {artworks.length === 0 && (
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={fetchArtworks}
            >
              <Text style={styles.refreshButtonText}>Refresh Artwork List</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.helperText}>
            Select the artwork you want to promote to users
          </Text>
        </>
      )}
    </View>
  );
  
  const renderArtMatSelector = () => (
    <View style={styles.formSection}>
      <Text style={styles.sectionTitle}>Art Material Details</Text>
      {loadingArtmaterials ? (
        <ActivityIndicator size="small" color="#007AFF" style={styles.loader} />
      ) : (
        <>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={artmatId}
              onValueChange={setArtmatId}
              style={styles.picker}
            >
              <Picker.Item label="-- Select an Art Material --" value="" />
              {artmats.map(material => (
                <Picker.Item 
                  key={material._id} 
                  label={`${material.name} - ${material.category}`} 
                  value={material._id} 
                />
              ))}
            </Picker>
          </View>
          
          {artmats.length === 0 && (
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={fetchArtMaterials}
            >
              <Text style={styles.refreshButtonText}>Refresh Art Materials List</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.helperText}>
            Select the art material you want to promote to users
          </Text>
        </>
      )}
    </View>
  );
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Admin Notification Center</Text>
        </View>
        
        {/* Promotion type selector */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Promotion Type</Text>
          <View style={styles.segmentedControl}>
            <TouchableOpacity 
              style={[
                styles.segmentButton, 
                promotionType === "artwork" && styles.segmentButtonActive
              ]}
              onPress={() => setPromotionType("artwork")}
            >
              <Text 
                style={[
                  styles.segmentButtonText,
                  promotionType === "artwork" && styles.segmentButtonTextActive
                ]}
              >
                Artwork
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.segmentButton, 
                promotionType === "artmat" && styles.segmentButtonActive
              ]}
              onPress={() => setPromotionType("artmat")}
            >
              <Text 
                style={[
                  styles.segmentButtonText,
                  promotionType === "artmat" && styles.segmentButtonTextActive
                ]}
              >
                Art Material
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Dynamic content based on promotion type */}
        {promotionType === "artwork" ? renderArtworkSelector() : renderArtMatSelector()}
        
        {/* Send button */}
        <TouchableOpacity 
          style={[styles.actionButton, isLoading && styles.actionButtonDisabled]}
          onPress={sendPromotion} 
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.actionButtonText}>Send Promotion</Text>
          )}
        </TouchableOpacity>
        
        <View style={styles.divider} />
        
        {/* Maintenance section */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Maintenance</Text>
          <TouchableOpacity 
            style={styles.maintenanceButton}
            onPress={cleanupStalePushTokens}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#666666" />
            ) : (
              <>
                <Text style={styles.maintenanceButtonText}>Clean Up Stale Push Tokens</Text>
                <Text style={styles.helperText}>
                  Remove invalid push tokens and improve delivery rates
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1C1C1E",
    textAlign: "center",
  },
  formSection: {
    marginBottom: 24,
    backgroundColor: "#F8F8FA",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#1C1C1E",
  },
  pickerContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E1E1E6",
    marginBottom: 12,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: "#E1E1E6",
    borderRadius: 8,
    padding: 4,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 6,
  },
  segmentButtonActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  segmentButtonText: {
    fontWeight: "500",
    color: "#666666",
  },
  segmentButtonTextActive: {
    color: "#007AFF",
  },
  actionButton: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 24,
  },
  actionButtonDisabled: {
    backgroundColor: "#A8A8A8",
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  divider: {
    height: 1,
    backgroundColor: "#E1E1E6",
    marginVertical: 24,
  },
  maintenanceButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E1E1E6",
  },
  maintenanceButtonText: {
    fontWeight: "600",
    color: "#333333",
    marginBottom: 4,
    fontSize: 16,
  },
  helperText: {
    fontSize: 14,
    color: "#8E8E93",
    marginTop: 4,
  },
  loader: {
    marginVertical: 20,
  },
  refreshButton: {
    padding: 12,
    alignItems: "center",
    backgroundColor: "#F2F2F7",
    borderRadius: 8,
    marginBottom: 12,
  },
  refreshButtonText: {
    color: "#007AFF",
    fontWeight: "500",
  }
});

export default AdminPromotionScreen;