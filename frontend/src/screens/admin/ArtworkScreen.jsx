import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Button,
  ActivityIndicator,
  FlatList,
  Alert,
  TouchableOpacity,
  Modal,
  TextInput,
  StyleSheet,
  Image,
  ScrollView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useSelector } from 'react-redux';
import * as ImagePicker from 'expo-image-picker';
import { getAdminArtworks, deleteArtwork, createArtwork, updateArtwork } from '../../api/artApi';
import { AntDesign } from '@expo/vector-icons';

const ArtworkScreen = () => {
  const token = useSelector((state) => state.auth.token); 

  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedArtwork, setSelectedArtwork] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState(''); 
  const [refreshing, setRefreshing] = useState(false);

  // Artwork fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [artist, setArtist] = useState('');
  const [medium, setMedium] = useState('');
  const [price, setPrice] = useState('');
  const [status, setStatus] = useState('available');
  const [images, setImages] = useState([]);

  useEffect(() => {
    fetchArtworks();
  }, []);

  const fetchArtworks = async () => {
    try {
      const data = await getAdminArtworks(token);
      setArtworks(data.artworks || []);
    } catch (err) {
      setError(err.message || "Failed to load artworks");
      setArtworks([]); 
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };
  
  

  const pickImages = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
    });
    if (!result.canceled) {
      setImages(result.assets.map((asset) => asset.uri));
    }
  };


  const handleDelete = async (id) => {
    if (!token) {
      Alert.alert("Error", "You must be logged in to delete an artwork.");
      return;
    }

    Alert.alert("Confirm Delete", "Are you sure you want to delete this artwork?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        onPress: async () => {
          try {
            await deleteArtwork(id, token);
            setArtworks((prev) => prev.filter((art) => art._id !== id));
          } catch (err) {
            Alert.alert("Error", err.message || "Failed to delete artwork");
          }
        },
      },
    ]);
  };

  const handleAddArtwork = async () => {
    if (loading) return; 
  
    if (!title || !description || !category || !artist || !medium || images.length === 0 || !price) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
  
    if (!token) {
      Alert.alert("Error", "You must be logged in to add artwork.");
      return;
    }
  
    setLoading(true); 
  
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("category", category);
      formData.append("artist", artist);
      formData.append("medium", medium);
      formData.append("price", price);
      formData.append("status", status);
  
      images.forEach((imageUri, index) => {
        let filename = imageUri.split('/').pop();
        let match = /\.(\w+)$/.exec(filename);
        let type = match ? `image/${match[1]}` : "image";
  
        formData.append(`images`, {
          uri: imageUri,
          name: filename,
          type,
        });
      });
  
      await createArtwork(formData, token);
      await fetchArtworks();
      closeModal();
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to add artwork");
    } finally {
      setLoading(false); 
    }
  };
  
  
  const handleUpdateArtwork = async () => {
    if (!title || !description || !category || !artist || !medium || images.length === 0 || !price) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
  
    if (!token) {
      Alert.alert("Error", "You must be logged in to update artwork.");
      return;
    }
  
    setLoading(true); // Set loading state
  
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("category", category);
      formData.append("artist", artist);
      formData.append("medium", medium);
      formData.append("price", price);
      formData.append("status", status);
  
      images.forEach((imageUri, index) => {
        if (imageUri.startsWith("http")) {
          formData.append(`existingImages[]`, imageUri);
        } else {
          let filename = imageUri.split("/").pop();
          let match = /\.(\w+)$/.exec(filename);
          let type = match ? `image/${match[1]}` : "image";
  
          formData.append(`images`, {
            uri: imageUri,
            name: filename,
            type,
          });
        }
      });
  
      const updatedArtwork = await updateArtwork(selectedArtwork._id, formData, token);
  
      setArtworks((prev) =>
        prev.map((art) => (art._id === updatedArtwork._id ? updatedArtwork : art))
      );
      
      await fetchArtworks();
      closeModal();
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to update artwork");
    } finally {
      setLoading(false); // Reset loading state
    }
  };
  

  const openModal = (type, artwork = null) => {
    setModalType(type);
    setSelectedArtwork(artwork);
    setTitle(artwork?.title || '');
    setDescription(artwork?.description || '');
    setCategory(artwork?.category || '');
    setArtist(artwork?.artist || '');
    setMedium(artwork?.medium || '');
    setPrice(artwork?.price?.toString() || '');
    setStatus(artwork?.status || 'available');
    setImages(artwork?.images?.map(img => img.url) || []);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedArtwork(null);
    setImages([]);
  };

  if (loading) return <ActivityIndicator size="large" color="#0000ff" />;
  if (error) return <Text style={{ color: "red" }}>{error}</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Artworks</Text>

      <FlatList
        data={artworks}
        keyExtractor={(item, index) => (item._id ? item._id.toString() : index.toString())}
        renderItem={({ item }) => (
          <View style={styles.artworkCard}>
            <ScrollView horizontal>
              {item.images?.map((img, index) => (
                <Image key={img.url || index} source={{ uri: img.url }} style={styles.artworkImage} />
              ))}
            </ScrollView>
            <Text style={styles.artworkTitle}>{item.title}</Text>
            <Text style={styles.artworkDetails}>Artist: {item.artist}</Text>
            <Text style={styles.artworkDetails}>Category: {item.category}</Text>
            <Text style={styles.artworkDetails}>Price: ₱{item.price}</Text>
            <Text style={styles.artworkDetails}>Status: {item.status}</Text>
            <View style={styles.buttonRow}>
              <Button title="Edit" onPress={() => openModal('update', item)} color="orange" />
              <Button title="Delete" onPress={() => handleDelete(item._id)} color="red" />
            </View>
          </View>
        )}
        refreshing={refreshing}
        onRefresh={fetchArtworks}
      />


      {/* Floating Add Button */}
      <TouchableOpacity style={styles.addButton} onPress={() => openModal("add")}>
        <AntDesign name="plus" size={24} color="white" />
      </TouchableOpacity>

      {/* Modal for View, Add, Update */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{modalType === "add" ? "Add Artwork" : "Edit Artwork"}</Text>
            <TextInput style={styles.input} placeholder="Title" value={title} onChangeText={setTitle} />
            <TextInput style={styles.input} placeholder="Description" value={description} onChangeText={setDescription} multiline />
            <TextInput style={styles.input} placeholder="Category" value={category} onChangeText={setCategory} />
            <TextInput style={styles.input} placeholder="Artist" value={artist} onChangeText={setArtist} />
            <TextInput style={styles.input} placeholder="Medium" value={medium} onChangeText={setMedium} />
            <TextInput style={styles.input} placeholder="Price" value={price} onChangeText={setPrice} keyboardType="numeric" />
            <Picker selectedValue={status} onValueChange={setStatus}>
              <Picker.Item label="Available" value="available" />
              <Picker.Item label="Sold" value="sold" />
            </Picker>
            <Button title="Pick Images" onPress={pickImages} />
            <ScrollView horizontal>
              {images.map((uri, index) => (
                <Image key={index} source={{ uri }} style={styles.previewImage} />
              ))}
            </ScrollView>
            <Button title={modalType === "add" ? "Add" : "Update"} onPress={modalType === "add" ? handleAddArtwork : handleUpdateArtwork} />
            <Button title="Close" onPress={closeModal} color="gray" />
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ArtworkScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f4f4f4',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  artworkCard: {
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
  },
  artworkTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#007AFF',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 10,
  },
  input: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 10,
  },
  artworkImage: {
    width: 100,
    height: 100,
    marginRight: 5,
    borderRadius: 5,
  },
  previewImage: {
    width: 100,
    height: 100,
    marginRight: 5,
    borderRadius: 5,
  },
  
});
