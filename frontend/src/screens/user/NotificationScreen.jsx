import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { Card, IconButton, Badge, Divider, ActivityIndicator } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { fetchNotifications } from '../../api/notificationApi';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Simple function to format date without date-fns
const formatTimeAgo = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now - date) / 1000);
  
  // Less than a minute
  if (seconds < 60) {
    return 'just now';
  }
  
  // Less than an hour
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  }
  
  // Less than a day
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  }
  
  // Less than a month
  const days = Math.floor(hours / 24);
  if (days < 30) {
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  }
  
  // Format as date
  return date.toLocaleDateString();
};

const NotificationScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const user = useSelector(state => state.auth.user);
  const token = useSelector(state => state.auth.token);
  const userRole = user?.role || 'guest';
  const dispatch = useDispatch();

  const loadNotifications = async () => {
    try {
      setError(null);
      setRefreshing(true);
      
      if (userRole !== 'user') {
        console.log('Not fetching notifications for non-user role:', userRole);
        setNotifications([]);
        return;
      }
      
      const data = await fetchNotifications(userRole);
      
      // Fix: Filter out notifications with data.type === "order"
      const filteredNotifications = (data || []).filter(notification => {
        // Check if data exists and data.type is not "order"
        return !(notification.data && notification.data.type === "order");
      });
      
      console.log('Filtered notifications:', filteredNotifications.length, 'out of', (data || []).length);
      setNotifications(filteredNotifications);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      setError('Unable to load notifications. Pull down to try again.');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && user?._id) {
      loadNotifications();
    } else {
      setLoading(false);
    }
  }, [token, user?._id]);

  const handleNotificationPress = (notification) => {
    // Navigate to the notification view screen
    navigation.navigate('NotificationView', {
      notificationId: notification._id
    });
  };

  const renderNotificationItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.7}
    >
      <Card 
        style={[
          styles.card, 
          !item.read && styles.unreadCard
        ]}
      >
        <View style={styles.cardContent}>
          <View style={styles.headerContainer}>
            <View style={styles.titleContainer}>
              {!item.read && <Badge style={styles.badge} size={10} />}
              <Text style={[styles.title, !item.read && styles.boldText]} numberOfLines={1}>{item.title}</Text>
            </View>
            <View style={styles.timeContainer}>
              <Text style={styles.timeText}>{formatTimeAgo(item.sentAt || item.createdAt)}</Text>
              <IconButton 
                icon={item.read ? "bell-outline" : "bell"} 
                size={20}
                color={item.read ? "#999" : "#2196F3"}
              />
            </View>
          </View>
          <Divider style={styles.divider} />
          <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
        </View>
      </Card>
    </TouchableOpacity>
  );

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      );
    }
    
    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={50} color="#FF5252" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons name="bell-off-outline" size={50} color="#757575" />
        <Text style={styles.emptyText}>No notifications yet</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item._id || String(Math.random())}
        renderItem={renderNotificationItem}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        contentContainerStyle={[
          styles.list,
          (!notifications || notifications.length === 0) && styles.emptyList
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadNotifications} />
        }
        ListEmptyComponent={renderEmpty()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  list: {
    padding: 16,
  },
  emptyList: {
    flexGrow: 1,
  },
  card: {
    marginBottom: 8,
    elevation: 2,
    borderRadius: 8,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  cardContent: {
    padding: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  badge: {
    backgroundColor: '#2196F3',
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    flex: 1,
  },
  boldText: {
    fontWeight: 'bold',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    color: '#757575',
  },
  divider: {
    marginVertical: 10,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#757575',
    marginTop: 10,
  },
  errorText: {
    fontSize: 16,
    color: '#FF5252',
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#757575',
    marginTop: 10,
  },
});

export default NotificationScreen;