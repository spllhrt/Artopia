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
import { getAdminArtmats, deleteArtmat, createArtmat, updateArtmat } from '../../api/matApi';
import { AntDesign } from '@expo/vector-icons';
import { setArtmats, setSelectedArtmat, setLoading, setError } from '../../redux/matSlice';
import { Picker } from '@react-native-picker/picker';

const MaterialScreen = () => {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);
  const { artmats, selectedArtmat, loading, error } = useSelector((state) => state.artmats);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  // Material fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [images, setImages] = useState([]);
  
  // Categories
  const categoryOptions = ['Painting', 'Sculpture', 'Photography', 'Craft'];

  useEffect(() => {
    fetchMaterials();
  }, []);

  useEffect(() => {
    if (selectedArtmat) {
      setName(selectedArtmat.name || '');
      setDescription(selectedArtmat.description || '');
      setCategory(selectedArtmat.category || '');
      setPrice(selectedArtmat.price?.toString() || '');
      setStock(selectedArtmat.stock?.toString() || '');
      setImages(selectedArtmat.images?.map(img => img.url) || []);
    }
  }, [selectedArtmat]);

  const fetchMaterials = async () => {
    try {
      dispatch(setLoading(true));
      const data = await getAdminArtmats(token);
      dispatch(setArtmats(data.artmats || []));
    } catch (err) {
      dispatch(setError(err.message || "Failed to load art materials"));
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
      Alert.alert("Error", "You must be logged in to delete a material.");
      return;
    }
    
    Alert.alert("Confirm Delete", "Are you sure you want to delete this material?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        onPress: async () => {
          try {
            dispatch(setLoading(true));
            await deleteArtmat(id, token);
            dispatch(setArtmats(artmats.filter((mat) => mat._id !== id)));
            Alert.alert("Success", "Material deleted successfully");
          } catch (err) {
            Alert.alert("Error", err.message || "Failed to delete material");
          } finally {
            dispatch(setLoading(false));
          }
        },
      },
    ]);
  };

  const handleAddMaterial = async () => {
    if (loading) return;
    
    if (!name || !description || !category || !price || !stock || images.length === 0) {
      Alert.alert("Error", "Please fill in all fields and select at least one image.");
      return;
    }
    
    if (!token) {
      Alert.alert("Error", "You must be logged in to add material.");
      return;
    }
    
    if (isNaN(parseFloat(price)) || isNaN(parseInt(stock))) {
      Alert.alert("Error", "Price and stock must be valid numbers.");
      return;
    }
    
    dispatch(setLoading(true));
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      formData.append("category", category);
      formData.append("price", price);
      formData.append("stock", stock);
      
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
      
      await createArtmat(formData, token);
      await fetchMaterials();
      Alert.alert("Success", "Material added successfully");
      closeModal();
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to add material");
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleUpdateMaterial = async () => {
    if (!selectedArtmat || !selectedArtmat._id) {
      Alert.alert("Error", "No material selected for update.");
      return;
    }
    
    if (!name || !description || !category || !price || !stock || images.length === 0) {
      Alert.alert("Error", "Please fill in all fields and include at least one image.");
      return;
    }
    
    if (!token) {
      Alert.alert("Error", "You must be logged in to update material.");
      return;
    }
    
    if (isNaN(parseFloat(price)) || isNaN(parseInt(stock))) {
      Alert.alert("Error", "Price and stock must be valid numbers.");
      return;
    }
    
    dispatch(setLoading(true));
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      formData.append("category", category);
      formData.append("price", price);
      formData.append("stock", stock);
      
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
      
      const updatedMaterial = await updateArtmat(selectedArtmat._id, formData, token);
      dispatch(setArtmats(artmats.map((mat) => (mat._id === updatedMaterial._id ? updatedMaterial : mat))));
      Alert.alert("Success", "Material updated successfully");
      closeModal();
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to update material");
    } finally {
      dispatch(setLoading(false));
    }
  };

  const removeImage = (index) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const openModal = (type, material = null) => {
    setModalType(type);
    dispatch(setSelectedArtmat(material));
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    dispatch(setSelectedArtmat(null));
    setName('');
    setDescription('');
    setCategory('');
    setPrice('');
    setStock('');
    setImages([]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.materialCard}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {item.images && item.images.length > 0 ? (
          item.images.map((img, index) => (
            <Image 
              key={index} 
              source={{ uri: img.url }} 
              style={styles.materialImage}
            />
          ))
        ) : (
          <View style={[styles.materialImage, styles.noImage]}>
            <Text>No Image</Text>
          </View>
        )}
      </ScrollView>
      
      <Text style={styles.materialTitle}>{item.name}</Text>
      <Text style={styles.materialDescription} numberOfLines={2}>{item.description}</Text>
      <Text style={styles.materialDetails}>Category: {item.category}</Text>
      <Text style={styles.materialDetails}>Price: ₱{item.price}</Text>
      <Text style={styles.materialDetails}>Stock: {item.stock} units</Text>
      
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
        <Text style={styles.loadingText}>Loading materials...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Art Materials</Text>
      
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button title="Retry" onPress={fetchMaterials} />
        </View>
      ) : artmats && artmats.length > 0 ? (
        <FlatList
          data={artmats}
          keyExtractor={(item) => item._id.toString()}
          renderItem={renderItem}
          refreshing={refreshing}
          onRefresh={fetchMaterials}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No materials found</Text>
          <Button title="Add your first material" onPress={() => openModal("add")} />
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
                {modalType === "add" ? "Add Material" : "Edit Material"}
              </Text>
              <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                <AntDesign name="close" size={24} color="black" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScroll}>
              <TextInput 
                style={styles.input} 
                placeholder="Name" 
                value={name} 
                onChangeText={setName} 
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
                placeholder="Price" 
                value={price} 
                onChangeText={setPrice} 
                keyboardType="numeric" 
              />
              
              <TextInput 
                style={styles.input} 
                placeholder="Stock" 
                value={stock} 
                onChangeText={setStock} 
                keyboardType="numeric" 
              />
              
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
                  onPress={modalType === "add" ? handleAddMaterial : handleUpdateMaterial}
                >
                  <Text style={styles.buttonText}>
                    {modalType === "add" ? "Add Material" : "Update Material"}
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
  materialCard: {
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
  materialTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 8,
    color: '#333',
  },
  materialDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  materialDetails: {
    fontSize: 14,
    marginBottom: 4,
    color: '#555',
  },
  materialImage: {
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

export default MaterialScreen;