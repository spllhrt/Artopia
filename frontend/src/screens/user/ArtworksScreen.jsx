import React from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";

const ArtworksScreen = () => {

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Artworks</Text>
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
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  artwork: {
    fontSize: 18,
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
});

export default ArtworksScreen;
