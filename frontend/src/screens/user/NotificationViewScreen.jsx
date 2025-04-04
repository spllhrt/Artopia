import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Alert,
  ScrollView,
  SafeAreaView,
  Image
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { fetchNotificationById } from '../../api/notificationApi';
import { getSingleArtwork } from '../../api/artApi';
import { getSingleArtmat } from '../../api/matApi';
import Icon from 'react-native-vector-icons/Ionicons';

const NotificationViewScreen = ({ route }) => {
  const navigation = useNavigation();
  const { notificationId } = route.params;
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contentDetails, setContentDetails] = useState(null);
  const [contentLoading, setContentLoading] = useState(false);
  const [hasNavigableContent, setHasNavigableContent] = useState(false); // Add this state variable

  useEffect(() => {
    let isMounted = true;
    
    const getNotification = async () => {
      try {
        setLoading(true);
        console.log('Fetching notification:', notificationId);
        
        const fetchedNotification = await fetchNotificationById(notificationId);
        console.log('Fetched notification:', JSON.stringify(fetchedNotification));
        
        if (isMounted) {
          if (!fetchedNotification) {
            setError(`Notification not found for ID: ${notificationId}`);
          } else {
            setNotification(fetchedNotification);
            
            // Fix for handling notification data
            if (fetchedNotification.data) {
              // Handle possible data formats
              let dataType, dataId;
              
              if (typeof fetchedNotification.data === 'object') {
                if (fetchedNotification.data instanceof Map) {
                  dataType = fetchedNotification.data.get('type');
                  dataId = fetchedNotification.data.get('id');
                } else {
                  // Regular object
                  dataType = fetchedNotification.data.type;
                  dataId = fetchedNotification.data.id;
                }
              } else if (typeof fetchedNotification.data === 'string') {
                // Try to parse if it's a JSON string
                try {
                  const parsedData = JSON.parse(fetchedNotification.data);
                  dataType = parsedData.type;
                  dataId = parsedData.id;
                } catch (e) {
                  console.error('Failed to parse notification data string:', e);
                }
              }
              
              console.log('Extracted data type:', dataType, 'id:', dataId);
              
              // Set hasNavigableContent based on data type and id
              setHasNavigableContent(!!(dataType && dataId && 
                (dataType === 'artwork' || dataType === 'artmat')));
                
              if ((dataType === 'artwork' || dataType === 'artmat') && dataId) {
                await fetchContentDetails(dataType, dataId);
              }
            }
          }
        }
      } catch (error) {
        if (isMounted) {
          setError(`Error: ${error.message}`);
          console.error("Error fetching notification:", error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    const fetchContentDetails = async (type, id) => {
      try {
        setContentLoading(true);
        console.log(`Fetching ${type} details for ID: ${id}`);
        
        let detailsData;
        if (type === 'artwork') {
          const response = await getSingleArtwork(id);
          detailsData = response.artwork || response; // Handle both response formats
        } else if (type === 'artmat') {
          const response = await getSingleArtmat(id);
          detailsData = response.artmat || response; // Handle both response formats
        }
        
        console.log('Fetched details data:', JSON.stringify(detailsData));
        
        if (isMounted && detailsData) {
          const contentData = { type, ...detailsData };
          setContentDetails(contentData);
        } else {
          console.log('No details data found or component unmounted');
        }
      } catch (error) {
        console.error(`Error fetching ${type} details:`, error);
        if (isMounted) {
          setError(`Failed to load ${type} details: ${error.message || 'Unknown error'}`);
        }
      } finally {
        if (isMounted) {
          setContentLoading(false);
        }
      }
    };
  
    getNotification();
    
    return () => {
      isMounted = false;
    };
  }, [notificationId]);

  const navigateBasedOnType = (type, id) => {
    if (!type || !id) {
      Alert.alert("Error", "Missing navigation parameters");
      return;
    }
    
    console.log(`Navigating to ${type} with ID: ${id}`);
    
    switch(type) {
      case 'artwork':
        navigation.navigate('Shop', { 
          screen: 'Shop',
          params: {
            screen: 'ArtworkDetailScreen',
            params: { id: id }
          }
        });
        break;
      case 'artmat':
        navigation.navigate('Shop', { 
          screen: 'Shop',
          params: {
            screen: 'ArtmatDetailScreen',
            params: { id: id }
          }
        });
        break;
      default:
        Alert.alert("Error", `Unknown content type: ${type}`);
    }
  };

  const handleNavigation = () => {
    if (!notification || !notification.data) {
      Alert.alert("Error", "No navigation data available");
      return;
    }
    
    try {
      let type, id;
      
      if (notification.data instanceof Map) {
        type = notification.data.get('type');
        id = notification.data.get('id');
      } else if (typeof notification.data === 'object') {
        type = notification.data.type;
        id = notification.data.id;
      } else if (typeof notification.data === 'string') {
        try {
          const parsedData = JSON.parse(notification.data);
          type = parsedData.type;
          id = parsedData.id;
        } catch (e) {
          console.error('Failed to parse notification data string:', e);
          Alert.alert("Error", "Invalid navigation data format");
          return;
        }
      }
      
      // Call navigateBasedOnType with the extracted data
      if (type && id) {
        navigateBasedOnType(type, id);
      } else {
        Alert.alert("Error", "Missing type or id for navigation");
      }
    } catch (err) {
      console.error("Navigation error:", err);
      Alert.alert("Navigation Error", "Could not navigate to the content");
    }
  };
  

  const renderContentDetails = () => {
    if (contentLoading) {
      return (
        <View style={styles.contentCard}>
          <ActivityIndicator size="small" color="#4a6fa5" />
          <Text style={styles.loadingText}>Loading details...</Text>
        </View>
      );
    }
    
    if (!contentDetails) {
      console.log('No content details to render');
      return null;
    }
    
    const { type } = contentDetails;
    
    // Determine the image URL based on possible field names
    const imageUrl = contentDetails.imageUrl || 
                    contentDetails.image || 
                    contentDetails.imageSrc || 
                    contentDetails.imageUri ||
                    null;
    
    return (
      <View style={styles.contentCard}>
        <Text style={styles.contentCardTitle}>
          {type === 'artwork' ? 'Artwork Details' : 'Art Material Details'}
        </Text>
        
        {imageUrl && (
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: imageUrl }} 
              style={styles.contentImage}
              resizeMode="cover"
            />
          </View>
        )}
        
        {type === 'artwork' ? (
          <>
            <Text style={styles.contentItemTitle}>{contentDetails.title || contentDetails.name || 'No Title'}</Text>
            <Text style={styles.contentItemDetail}>Artist: {contentDetails.artist || 'Unknown'}</Text>
            {contentDetails.medium && (
              <Text style={styles.contentItemDetail}>Medium: {contentDetails.medium}</Text>
            )}
            {contentDetails.dimensions && (
              <Text style={styles.contentItemDetail}>Dimensions: {contentDetails.dimensions}</Text>
            )}
            {contentDetails.year && (
              <Text style={styles.contentItemDetail}>Year: {contentDetails.year}</Text>
            )}
            {contentDetails.description && (
              <Text style={styles.contentItemDescription}>{contentDetails.description}</Text>
            )}
            <Text style={styles.contentItemPrice}>
              ${typeof contentDetails.price === 'number' ? 
                contentDetails.price.toFixed(2) : 
                contentDetails.price || '0.00'}
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.contentItemTitle}>{contentDetails.name || contentDetails.title || 'No Name'}</Text>
            {contentDetails.category && (
              <Text style={styles.contentItemDetail}>Category: {contentDetails.category}</Text>
            )}
            {contentDetails.brand && (
              <Text style={styles.contentItemDetail}>Brand: {contentDetails.brand}</Text>
            )}
            {contentDetails.description && (
              <Text style={styles.contentItemDescription}>{contentDetails.description}</Text>
            )}
            <Text style={styles.contentItemPrice}>
              ${typeof contentDetails.price === 'number' ? 
                contentDetails.price.toFixed(2) : 
                contentDetails.price || '0.00'}
            </Text>
          </>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4a6fa5" />
        <Text style={styles.loadingText}>Loading notification...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Icon name="alert-circle-outline" size={60} color="#e74c3c" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.buttonSecondary} 
          onPress={() => navigation.goBack()}>
          <Text style={styles.buttonTextSecondary}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!notification) {
    return (
      <View style={styles.centerContainer}>
        <Icon name="close-circle-outline" size={60} color="#e74c3c" />
        <Text style={styles.errorText}>Notification not found.</Text>
        <TouchableOpacity 
          style={styles.buttonSecondary} 
          onPress={() => navigation.goBack()}>
          <Text style={styles.buttonTextSecondary}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => navigation.goBack()}>
              <Icon name="arrow-back" size={24} color="#4a6fa5" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Notification Details</Text>
          </View>
          
          <View style={styles.card}>
            <Text style={styles.title}>{notification.title}</Text>
            <Text style={styles.message}>{notification.message}</Text>
            <Text style={styles.timestamp}>
              {new Date(notification.sentAt).toLocaleString()}
            </Text>
          </View>
          
          {renderContentDetails()}
          
          {hasNavigableContent && (
            <View style={styles.actionsContainer}>
              <TouchableOpacity 
                style={styles.buttonPrimary} 
                onPress={handleNavigation}>
                <Text style={styles.buttonTextPrimary}>View Full Details</Text>
                <Icon name="chevron-forward" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f7fa'
  },
  scrollContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 16,
    color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  contentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#4a6fa5',
  },
  contentCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4a6fa5',
    marginBottom: 12,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  contentImage: {
    width: '100%',
    height: '100%',
  },
  contentItemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  contentItemDetail: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  contentItemDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    marginBottom: 8,
    lineHeight: 20,
  },
  contentItemPrice: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2ecc71',
    marginTop: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  message: {
    fontSize: 16,
    marginBottom: 16,
    lineHeight: 24,
    color: '#555',
  },
  timestamp: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
  },
  actionsContainer: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#4a6fa5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonTextPrimary: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginRight: 8,
  },
  buttonSecondary: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonTextSecondary: {
    color: '#555',
    fontWeight: '600',
    fontSize: 16,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    marginTop: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
});

export default NotificationViewScreen;