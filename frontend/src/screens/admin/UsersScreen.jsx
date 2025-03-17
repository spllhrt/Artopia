import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
  Modal,
  ScrollView,
  SafeAreaView
} from 'react-native';
import { getAllUsers, updateUserRole, getUserDetails } from '../../api/authApi';
import Icon from 'react-native-vector-icons/MaterialIcons';

const UsersScreen = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAllUsers();
      setUsers(response.users);
    } catch (error) {
      setError(error.message || 'Failed to load users');
      Alert.alert('Error', error.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);
  const handleRoleUpdate = async (userId, currentRole) => {
    // Toggle between 'user' and 'admin' roles
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    
    Alert.alert(
      'Change User Role',
      `Are you sure you want to change this user's role to ${newRole}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: async () => {
            try {
              setLoading(true);
              // Send the updated role to the server
              await updateUserRole(userId, newRole);
              
              // After successful update, fetch the user list again
              const response = await getAllUsers();
              setUsers(response.users);
              
              // Show success message
              Alert.alert('Success', `User role updated to ${newRole}`);
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to update user role');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const viewUserDetails = async (userId) => {
    try {
      setLoadingUserDetails(true);
      const response = await getUserDetails(userId);
      setSelectedUser(response.user);
      setModalVisible(true);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to load user details');
    } finally {
      setLoadingUserDetails(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <View style={styles.avatarContainer}>
          {item.avatar && item.avatar.url ? (
            <Image source={{ uri: item.avatar.url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
            </View>
          )}
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{item.role}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => viewUserDetails(item._id)}
        >
          <Icon name="visibility" size={20} color="#4a6da7" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleRoleUpdate(item._id, item.role)}
        >
          <Icon name="edit" size={20} color="#4a6da7" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderUserDetailsModal = () => {
    if (!selectedUser) return null;
    
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          setSelectedUser(null);
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>User Details</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => {
                  setModalVisible(false);
                  setSelectedUser(null);
                }}
              >
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            {loadingUserDetails ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color="#4a6da7" />
                <Text style={styles.loadingText}>Loading user details...</Text>
              </View>
            ) : (
              <ScrollView style={styles.modalBody}>
                <View style={styles.userProfileHeader}>
                  <View style={styles.modalAvatarContainer}>
                    {selectedUser.avatar && selectedUser.avatar.url ? (
                      <Image source={{ uri: selectedUser.avatar.url }} style={styles.modalAvatar} />
                    ) : (
                      <View style={styles.modalAvatarPlaceholder}>
                        <Text style={styles.modalAvatarText}>{selectedUser.name.charAt(0).toUpperCase()}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.modalUserName}>{selectedUser.name}</Text>
                  <View style={styles.modalRoleBadge}>
                    <Text style={styles.modalRoleText}>{selectedUser.role}</Text>
                  </View>
                </View>
                
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Contact Information</Text>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Email:</Text>
                    <Text style={styles.detailValue}>{selectedUser.email}</Text>
                  </View>
                </View>
                
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Account Information</Text>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>User ID:</Text>
                    <Text style={styles.detailValue}>{selectedUser._id}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Created At:</Text>
                    <Text style={styles.detailValue}>
                      {selectedUser.createdAt 
                        ? new Date(selectedUser.createdAt).toLocaleDateString() 
                        : 'N/A'}
                    </Text>
                  </View>
                </View>
                
                <TouchableOpacity 
                  style={styles.roleChangeButton}
                  onPress={() => {
                    setModalVisible(false);
                    handleRoleUpdate(selectedUser._id, selectedUser.role);
                  }}
                >
                  <Text style={styles.roleChangeButtonText}>
                    Change Role to {selectedUser.role === 'admin' ? 'User' : 'Admin'}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#4a6da7" />
        <Text style={styles.loadingText}>Loading users...</Text>
      </View>
    );
  }

  if (error && !refreshing && users.length === 0) {
    return (
      <View style={styles.centeredContainer}>
        <Icon name="error-outline" size={60} color="#ff6b6b" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchUsers}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Manage Users</Text>
        <Text style={styles.subtitle}>Total users: {users.length}</Text>
      </View>
      
      <FlatList
        data={users}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        }
      />
      
      {renderUserDetailsModal()}
    </View>
  );
};
const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f8f9fa',
    },
    header: {
      padding: 16,
      backgroundColor: '#ffffff',
      borderBottomWidth: 1,
      borderBottomColor: '#e1e4e8',
    },
    title: {
      fontSize: 22,
      fontWeight: 'bold',
      color: '#333',
    },
    subtitle: {
      fontSize: 14,
      color: '#666',
      marginTop: 4,
    },
    listContainer: {
      padding: 12,
    },
    userCard: {
      backgroundColor: '#ffffff',
      borderRadius: 8,
      padding: 16,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    userInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    avatarContainer: {
      marginRight: 16,
    },
    avatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
    },
    avatarPlaceholder: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: '#e1e4e8',
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#4a6da7',
    },
    userDetails: {
      flex: 1,
    },
    userName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#333',
    },
    userEmail: {
      fontSize: 14,
      color: '#666',
      marginTop: 2,
    },
    roleBadge: {
      backgroundColor: '#e1e4e8',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
      alignSelf: 'flex-start',
      marginTop: 4,
    },
    roleText: {
      fontSize: 12,
      color: '#4a6da7',
      fontWeight: '500',
    },
    actionButtons: {
      flexDirection: 'row',
    },
    actionButton: {
      padding: 8,
      marginLeft: 8,
    },
    centeredContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 16,
      color: '#666',
    },
    errorText: {
      marginTop: 12,
      fontSize: 16,
      color: '#ff6b6b',
      textAlign: 'center',
    },
    retryButton: {
      marginTop: 20,
      backgroundColor: '#4a6da7',
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 6,
    },
    retryButtonText: {
      fontSize: 16,
      color: '#ffffff',
      fontWeight: '500',
    },
    emptyContainer: {
      padding: 20,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 16,
      color: '#666',
    },
    
    // Modal styles
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      backgroundColor: '#ffffff',
      borderRadius: 10,
      margin: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
      maxHeight: '80%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: '#e1e4e8',
      padding: 16,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#333',
    },
    closeButton: {
      padding: 4,
    },
    modalBody: {
      padding: 16,
    },
    modalLoading: {
      padding: 30,
      alignItems: 'center',
    },
    userProfileHeader: {
      alignItems: 'center',
      marginBottom: 20,
    },
    modalAvatarContainer: {
      marginBottom: 16,
    },
    modalAvatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
    },
    modalAvatarPlaceholder: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: '#e1e4e8',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalAvatarText: {
      fontSize: 36,
      fontWeight: 'bold',
      color: '#4a6da7',
    },
    modalUserName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 8,
    },
    modalRoleBadge: {
      backgroundColor: '#e1e4e8',
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 16,
      marginBottom: 16,
    },
    modalRoleText: {
      fontSize: 14,
      color: '#4a6da7',
      fontWeight: '500',
    },
    detailSection: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#333',
      marginBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#e1e4e8',
      paddingBottom: 8,
    },
    detailItem: {
      flexDirection: 'row',
      marginBottom: 12,
    },
    detailLabel: {
      fontSize: 14,
      color: '#666',
      width: 100,
      fontWeight: '500',
    },
    detailValue: {
      fontSize: 14,
      color: '#333',
      flex: 1,
    },
    roleChangeButton: {
      backgroundColor: '#4a6da7',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      marginTop: 20,
      alignItems: 'center',
    },
    roleChangeButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '500',
    },
  });
  export default UsersScreen;