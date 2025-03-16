import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from '@expo/vector-icons';

const ShopScreen = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Explore Now</Text>
      
      <View style={styles.cardsContainer}>
        {/* Art Mats Card */}
        <TouchableOpacity 
          style={styles.card}
          onPress={() => navigation.navigate("ArtmatsScreen")}
        >
          <View style={styles.cardImageContainer}>
            <Ionicons name="brush-outline" size={50} color="#C4A77D" />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Art Materials</Text>
            <Text style={styles.cardDescription}>
              Browse high-quality brushes, paints, canvases and more
            </Text>
            <View style={styles.cardFooter}>
              <Text style={styles.shopNowText}>Shop Now</Text>
              <Ionicons name="arrow-forward" size={18} color="#C4A77D" />
            </View>
          </View>
        </TouchableOpacity>

        {/* Artworks Card */}
        <TouchableOpacity 
          style={styles.card}
          onPress={() => navigation.navigate("ArtworksScreen")}
        >
          <View style={styles.cardImageContainer}>
            <Ionicons name="image-outline" size={50} color="#C4A77D" />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Artworks</Text>
            <Text style={styles.cardDescription}>
              Discover unique paintings, prints and digital art
            </Text>
            <View style={styles.cardFooter}>
              <Text style={styles.shopNowText}>Shop Now</Text>
              <Ionicons name="arrow-forward" size={18} color="#C4A77D" />
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 24,
    marginTop: 50,
    textAlign: "center",
    color: "#333",
  },
  cardsContainer: {
    gap: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 16,
    flexDirection: "row",
    height: 150,
  },
  cardImageContainer: {
    width: 100,
    backgroundColor: "#f9f5f0",
    justifyContent: "center",
    alignItems: "center",
  },
  cardContent: {
    flex: 1,
    padding: 16,
    justifyContent: "space-between",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  cardDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
  },
  shopNowText: {
    color: "#C4A77D",
    fontWeight: "600",
    marginRight: 5,
  },
});

export default ShopScreen;