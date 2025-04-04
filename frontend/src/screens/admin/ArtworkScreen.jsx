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
import { useSelector, useDispatch } from 'react-redux';
import * as ImagePicker from 'expo-image-picker';
import { getAdminArtworks, deleteArtwork, createArtwork, updateArtwork } from '../../api/artApi';
import { AntDesign } from '@expo/vector-icons';
import { setArtworks, setSelectedArtwork, setLoading, setError } from '../../redux/artSlice';
import { Picker } from '@react-native-picker/picker';

const ArtworkScreen = () => {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);
  const { artworks, selectedArtwork, loading, error } = useSelector((state) => state.artworks);
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
  
  // Categories
  const categoryOptions = [
    'Painting',
    'Sculpture',
    'Photography',
    'Digital Art',
    'Mixed Media',
    'Drawing',
    'Printmaking',
    'Ceramics',
    'Other'
  ];

  useEffect(() => {
    fetchArtworks();
  }, []);

  useEffect(() => {
    if (selectedArtwork) {
      setTitle(selectedArtwork.title || '');
      setDescription(selectedArtwork.description || '');
      setCategory(selectedArtwork.category || '');
      setArtist(selectedArtwork.artist || '');
      setMedium(selectedArtwork.medium || '');
      setPrice(selectedArtwork.price?.toString() || '');
      setStatus(selectedArtwork.status || 'available');
      setImages(selectedArtwork.images?.map(img => img.url) || []);
    }
  }, [selectedArtwork]);

  const fetchArtworks = async () => {
    try {
      dispatch(setLoading(true));
      const data = await getAdminArtworks(token);
      dispatch(setArtworks(data.artworks || []));
      dispatch(setError(null));
    } catch (err) {
      dispatch(setError(err.message || "Failed to load artworks"));
    } finally {
      setRefreshing(false);
      dispatch(setLoading(false));
    }
  };

  const pickImages = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert("Permission Required", "You need to grant gallery permissions to select images.");
        return;
      }
      
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 1,
      });
      
      if (!result.canceled && result.assets) {
        setImages([...images, ...result.assets.map((asset) => asset.uri)]);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick images");
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
            dispatch(setLoading(true));
            await deleteArtwork(id, token);
            dispatch(setArtworks(artworks.filter((art) => art._id !== id)));
            Alert.alert("Success", "Artwork deleted successfully");
          } catch (err) {
            Alert.alert("Error", err.message || "Failed to delete artwork");
          } finally {
            dispatch(setLoading(false));
          }
        },
      },
    ]);
  };

  const handleAddArtwork = async () => {
    if (loading) return;
    
    if (!title || !description || !category || !artist || !medium || !price || images.length === 0) {
      Alert.alert("Error", "Please fill in all fields and select at least one image.");
      return;
    }
    
    if (!token) {
      Alert.alert("Error", "You must be logged in to add artwork.");
      return;
    }
    
    if (isNaN(parseFloat(price))) {
      Alert.alert("Error", "Price must be a valid number.");
      return;
    }
    
    dispatch(setLoading(true));
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
        let type = match ? `image/${match[1]}` : "image/jpeg";
        formData.append("images", {
          uri: imageUri,
          name: filename,
          type,
        });
      });
      
      await createArtwork(formData, token);
      await fetchArtworks();
      Alert.alert("Success", "Artwork added successfully");
      closeModal();
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to add artwork");
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleUpdateArtwork = async () => {
    if (!selectedArtwork || !selectedArtwork._id) {
      Alert.alert("Error", "No artwork selected for update.");
      return;
    }
    
    if (!title || !description || !category || !artist || !medium || !price || images.length === 0) {
      Alert.alert("Error", "Please fill in all fields and include at least one image.");
      return;
    }
    
    if (!token) {
      Alert.alert("Error", "You must be logged in to update artwork.");
      return;
    }
    
    if (isNaN(parseFloat(price))) {
      Alert.alert("Error", "Price must be a valid number.");
      return;
    }
    
    dispatch(setLoading(true));
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("category", category);
      formData.append("artist", artist);
      formData.append("medium", medium);
      formData.append("price", price);
      formData.append("status", status);
      
      // Handle both existing and new images
      const existingImages = [];
      const newImages = [];
      
      images.forEach((imageUri) => {
        if (imageUri.startsWith("http")) {
          existingImages.push(imageUri);
        } else {
          newImages.push(imageUri);
        }
      });
      
      if (existingImages.length > 0) {
        formData.append("existingImages", JSON.stringify(existingImages));
      }
      
      newImages.forEach((imageUri) => {
        let filename = imageUri.split("/").pop();
        let match = /\.(\w+)$/.exec(filename);
        let type = match ? `image/${match[1]}` : "image/jpeg";
        formData.append("images", {
          uri: imageUri,
          name: filename,
          type,
        });
      });
      
      const updatedArtwork = await updateArtwork(selectedArtwork._id, formData, token);
      dispatch(setArtworks(artworks.map((art) => (art._id === updatedArtwork._id ? updatedArtwork : art))));
      Alert.alert("Success", "Artwork updated successfully");
      closeModal();
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to update artwork");
    } finally {
      dispatch(setLoading(false));
    }
  };

  const removeImage = (index) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const openModal = (type, artwork = null) => {
    setModalType(type);
    dispatch(setSelectedArtwork(artwork));
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    dispatch(setSelectedArtwork(null));
    setTitle('');
    setDescription('');
    setCategory('');
    setArtist('');
    setMedium('');
    setPrice('');
    setStatus('available');
    setImages([]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.artworkCard}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {item.images && item.images.length > 0 ? (
          item.images.map((img, index) => (
            <Image 
              key={index} 
              source={{ uri: img.url }} 
              style={styles.artworkImage}
            />
          ))
        ) : (
          <View style={[styles.artworkImage, styles.noImage]}>
            <Text>No Image</Text>
          </View>
        )}
      </ScrollView>
      
      <Text style={styles.artworkTitle}>{item.title}</Text>
      <Text style={styles.artworkDescription} numberOfLines={2}>{item.description}</Text>
      <Text style={styles.artworkDetails}>Artist: {item.artist}</Text>
      <Text style={styles.artworkDetails}>Category: {item.category}</Text>
      <Text style={styles.artworkDetails}>Medium: {item.medium}</Text>
      <Text style={styles.artworkDetails}>Price: ₱{item.price}</Text>
      <Text style={styles.artworkDetails}>Status: {item.status}</Text>
      
      <View style={styles.buttonRow}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]} 
          onPress={() => openModal('update', item)}
        >
          <Text style={styles.buttonText}>Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]} 
          onPress={() => handleDelete(item._id)}
        >
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading artworks...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Artworks</Text>
      
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button title="Retry" onPress={fetchArtworks} />
        </View>
      ) : artworks && artworks.length > 0 ? (
        <FlatList
          data={artworks}
          keyExtractor={(item) => item._id.toString()}
          renderItem={renderItem}
          refreshing={refreshing}
          onRefresh={fetchArtworks}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No artworks found</Text>
          <Button title="Add your first artwork" onPress={() => openModal("add")} />
        </View>
      )}

      {/* Floating Add Button */}
      <TouchableOpacity style={styles.addButton} onPress={() => openModal("add")}>
        <AntDesign name="plus" size={24} color="white" />
      </TouchableOpacity>

      {/* Modal for Add, Update */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modalType === "add" ? "Add Artwork" : "Edit Artwork"}
              </Text>
              <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                <AntDesign name="close" size={24} color="black" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScroll}>
              <TextInput 
                style={styles.input} 
                placeholder="Title" 
                value={title} 
                onChangeText={setTitle} 
              />
              
              <TextInput 
                style={[styles.input, styles.textArea]} 
                placeholder="Description" 
                value={description} 
                onChangeText={setDescription} 
                multiline 
                numberOfLines={4}
              />
              
              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={category}
                  onValueChange={setCategory}
                  style={styles.picker}
                >
                  <Picker.Item label="Select a category" value="" />
                  {categoryOptions.map((option, index) => (
                    <Picker.Item label={option} value={option} key={index} />
                  ))}
                </Picker>
              </View>
              
              <TextInput 
                style={styles.input} 
                placeholder="Artist" 
                value={artist} 
                onChangeText={setArtist} 
              />
              
              <TextInput 
                style={styles.input} 
                placeholder="Medium" 
                value={medium} 
                onChangeText={setMedium} 
              />
              
              <TextInput 
                style={styles.input} 
                placeholder="Price" 
                value={price} 
                onChangeText={setPrice} 
                keyboardType="numeric" 
              />
              
              <Text style={styles.inputLabel}>Status</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={status}
                  onValueChange={setStatus}
                  style={styles.picker}
                >
                  <Picker.Item label="Available" value="available" />
                  <Picker.Item label="Sold" value="sold" />
                </Picker>
              </View>
              
              <View style={styles.imageSection}>
                <Text style={styles.inputLabel}>Images</Text>
                <TouchableOpacity style={styles.imagePicker} onPress={pickImages}>
                  <AntDesign name="picture" size={24} color="#007AFF" />
                  <Text style={styles.imagePickerText}>Select Images</Text>
                </TouchableOpacity>
                
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagePreviewScroll}>
                  {images.length > 0 ? (
                    images.map((uri, index) => (
                      <View key={index} style={styles.imagePreviewContainer}>
                        <Image source={{ uri }} style={styles.previewImage} />
                        <TouchableOpacity 
                          style={styles.removeImageButton} 
                          onPress={() => removeImage(index)}
                        >
                          <AntDesign name="closecircle" size={18} color="#FF3B30" />
                        </TouchableOpacity>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noImagesText}>No images selected</Text>
                  )}
                </ScrollView>
              </View>
              
              <View style={styles.actionButtonsContainer}>
                <TouchableOpacity 
                  style={[styles.formButton, styles.submitButton]} 
                  onPress={modalType === "add" ? handleAddArtwork : handleUpdateArtwork}
                >
                  <Text style={styles.buttonText}>
                    {modalType === "add" ? "Add Artwork" : "Update Artwork"}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f4f4f4',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  listContent: {
    paddingBottom: 80,
  },
  artworkCard: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  artworkTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 8,
    color: '#333',
  },
  artworkDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  artworkDetails: {
    fontSize: 14,
    marginBottom: 4,
    color: '#555',
  },
  artworkImage: {
    width: 120,
    height: 120,
    marginRight: 8,
    borderRadius: 8,
  },
  noImage: {
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  editButton: {
    backgroundColor: '#FF9500',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
  addButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#007AFF',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  modalScroll: {
    padding: 16,
  },
  input: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
    fontWeight: '500',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
    height: 50,
  },
  imageSection: {
    marginBottom: 16,
  },
  imagePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  imagePickerText: {
    marginLeft: 8,
    color: '#007AFF',
    fontWeight: '500',
  },
  imagePreviewScroll: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  imagePreviewContainer: {
    position: 'relative',
    marginRight: 8,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 2,
  },
  noImagesText: {
    padding: 16,
    color: '#666',
  },
  actionButtonsContainer: {
    marginTop: 8,
    marginBottom: 20,
  },
  formButton: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  submitButton: {
    backgroundColor: '#007AFF',
  },
});

export default ArtworkScreen;