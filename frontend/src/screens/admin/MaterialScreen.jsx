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
      const data = await getAdminArtmats();
      dispatch(setArtmats(data.artmats || []));
    } catch (err) {
      dispatch(setError(err.message || "Failed to load art materials"));
    } finally {
      setRefreshing(false);
      dispatch(setLoading(false));
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
      Alert.alert("Error", "You must be logged in to delete a material.");
      return;
    }

    Alert.alert("Confirm Delete", "Are you sure you want to delete this material?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        onPress: async () => {
          try {
            await deleteArtmat(id);
            // Update the Redux store after successful deletion
            dispatch(setArtmats(artmats.filter((mat) => mat._id !== id)));
          } catch (err) {
            Alert.alert("Error", err.message || "Failed to delete material");
          }
        },
      },
    ]);
  };

  const handleAddMaterial = async () => {
    if (loading) return;

    if (!name || !description || !category || !price || !stock || images.length === 0) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    if (!token) {
      Alert.alert("Error", "You must be logged in to add material.");
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
        let type = match ? `image/${match[1]}` : "image";

        formData.append(`images`, {
          uri: imageUri,
          name: filename,
          type,
        });
      });

      await createArtmat(formData);
      await fetchMaterials();
      closeModal();
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to add material");
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleUpdateMaterial = async () => {
    if (!name || !description || !category || !price || !stock || images.length === 0) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    if (!token) {
      Alert.alert("Error", "You must be logged in to update material.");
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

      const updatedMaterial = await updateArtmat(selectedArtmat._id, formData);

      // Update the Redux store after successful update
      dispatch(setArtmats(artmats.map((mat) => (mat._id === updatedMaterial._id ? updatedMaterial : mat))));
      
      await fetchMaterials();
      closeModal();
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to update material");
    } finally {
      dispatch(setLoading(false));
    }
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

  if (loading) return <ActivityIndicator size="large" color="#0000ff" />;
  if (error) return <Text style={{ color: "red" }}>{error}</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Art Materials</Text>

      <FlatList
        data={artmats}
        keyExtractor={(item, index) => (item._id ? item._id.toString() : index.toString())}
        renderItem={({ item }) => (
          <View style={styles.materialCard}>
            <ScrollView horizontal>
              {item.images?.map((img, index) => (
                <Image key={img.url || index} source={{ uri: img.url }} style={styles.materialImage} />
              ))}
            </ScrollView>
            <Text style={styles.materialTitle}>{item.name}</Text>
            <Text style={styles.materialDetails}>Category: {item.category}</Text>
            <Text style={styles.materialDetails}>Price: ₱{item.price}</Text>
            <Text style={styles.materialDetails}>Stock: {item.stock} units</Text>
            <View style={styles.buttonRow}>
              <Button title="Edit" onPress={() => openModal('update', item)} color="orange" />
              <Button title="Delete" onPress={() => handleDelete(item._id)} color="red" />
            </View>
          </View>
        )}
        refreshing={refreshing}
        onRefresh={fetchMaterials}
      />

      {/* Floating Add Button */}
      <TouchableOpacity style={styles.addButton} onPress={() => openModal("add")}>
        <AntDesign name="plus" size={24} color="white" />
      </TouchableOpacity>

      {/* Modal for Add, Update */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{modalType === "add" ? "Add Material" : "Edit Material"}</Text>
            <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder="Description" value={description} onChangeText={setDescription} multiline />
            <TextInput style={styles.input} placeholder="Category" value={category} onChangeText={setCategory} />
            <TextInput style={styles.input} placeholder="Price" value={price} onChangeText={setPrice} keyboardType="numeric" />
            <TextInput style={styles.input} placeholder="Stock" value={stock} onChangeText={setStock} keyboardType="numeric" />
            <Button title="Pick Images" onPress={pickImages} />
            <ScrollView horizontal>
              {images.map((uri, index) => (
                <Image key={index} source={{ uri }} style={styles.previewImage} />
              ))}
            </ScrollView>
            <Button title={modalType === "add" ? "Add" : "Update"} onPress={modalType === "add" ? handleAddMaterial : handleUpdateMaterial} />
            <Button title="Close" onPress={closeModal} color="gray" />
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default MaterialScreen;

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
  materialCard: {
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
  },
  materialTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  materialDetails: {
    fontSize: 14,
    marginBottom: 4,
    color: '#333',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
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
  materialImage: {
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