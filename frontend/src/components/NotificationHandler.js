import React, { useEffect, useRef, useContext } from "react";
import { Platform, AppState } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { savePushToken, updatePushToken } from "../redux/authSlice";
import { fetchNotifications, cleanupTokens } from "../api/notificationApi";
import { useNavigation, NavigationContext } from "@react-navigation/native";
import { getOrderDetails } from "../api/orderApi";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const NotificationHandler = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const navigationContext = useContext(NavigationContext);
  const appState = useRef(AppState.currentState);
  
  const userId = useSelector(state => state.auth.user?._id);
  const userRole = useSelector(state => state.auth.user?.role || 'guest');
  const storedPushToken = useSelector(state => state.auth.user?.pushToken);
  const tokenExpires = useSelector(state => state.auth.user?.pushTokenExpires);
  
  const tokenRegistrationInProgress = useRef(false);
  const tokenRegistrationInitiated = useRef(false); // New flag to track if registration has been initiated
  const notificationFetchInProgress = useRef(false);
  const lastFetchTime = useRef(0);
  const setupComplete = useRef(false);
  const previousUserId = useRef(null);
  const displayedNotifications = useRef(new Map());
  
  const loadSeenNotifications = async () => {
    if (!userId) return;
    
    try {
      const key = `@seen_notifications_${userId}`;
      const storedData = await AsyncStorage.getItem(key);
      
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        const seenNotifications = new Map();
        Object.entries(parsedData).forEach(([notificationKey, timestamp]) => {
          seenNotifications.set(notificationKey, timestamp);
        });
        
        displayedNotifications.current = seenNotifications;
      }
    } catch (error) {
      console.error("Error loading seen notifications:", error);
    }
  };
  
  const saveSeenNotifications = async () => {
    if (!userId) return;
    
    try {
      const key = `@seen_notifications_${userId}`;
      const dataToStore = Object.fromEntries(displayedNotifications.current);
      await AsyncStorage.setItem(key, JSON.stringify(dataToStore));
    } catch (error) {
      console.error("Error saving seen notifications:", error);
    }
  };
  
  const isTokenExpired = () => {
    if (!tokenExpires) {
      return true;
    }
    
    const expiryDate = new Date(tokenExpires);
    const now = new Date();
    const isExpired = now > expiryDate;
    
    console.log(`TOKEN_CHECK: Token expires on ${expiryDate.toISOString()}, currently ${now.toISOString()}, isExpired: ${isExpired}`);
    
    return isExpired;
  };
  
  const registerForPushNotifications = async (retryCount = 0) => {
    if (tokenRegistrationInProgress.current) {
      return null;
    }
    
    tokenRegistrationInProgress.current = true;
    tokenRegistrationInitiated.current = true; // Set the initiated flag
    console.log(`TOKEN_REGISTER: Starting registration process (attempt ${retryCount + 1})`);
    
    try {
      if (!Device.isDevice) {
        console.log("TOKEN_REGISTER: Not a physical device, exiting registration");
        tokenRegistrationInProgress.current = false;
        return null;
      }
      
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      console.log(`TOKEN_REGISTER: Current permission status: ${existingStatus}`);
      
      let finalStatus = existingStatus;
      
      if (existingStatus !== "granted") {
        console.log("TOKEN_REGISTER: Permission not granted, requesting permission");
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== "granted") {
        console.log("TOKEN_REGISTER: Permission denied, exiting registration");
        tokenRegistrationInProgress.current = false;
        return null;
      }
      
      console.log("TOKEN_REGISTER: Permission granted, getting Expo push token");
      const tokenResponse = await Notifications.getExpoPushTokenAsync({
        projectId: "dbb5c3f7-c191-48ea-87ad-df93f43ecd8b",
      });
      
      const token = tokenResponse.data;
      console.log(`TOKEN_REGISTER: Token received: ${token}`);
      
      // Save the token to both Redux and the API
      if (userId) {
        console.log(`TOKEN_UPDATE: Saving token to Redux and API: ${token}`);
        try {
          await Promise.all([
            dispatch(updatePushToken(token)),
            dispatch(savePushToken({ userId, pushToken: token }))
          ]);
          console.log("TOKEN_UPDATE: Token successfully saved");
        } catch (error) {
          console.error("TOKEN_UPDATE: Error saving token:", error);
        }
      }
      
      tokenRegistrationInProgress.current = false;
      return token;
    } catch (error) {
      console.error("TOKEN_REGISTER: Error getting Expo Push Token:", error);
      
      if (retryCount < 2) { // Reduced retry count
        console.log(`TOKEN_REGISTER: Will retry in 2000ms`);
        tokenRegistrationInProgress.current = false;
        return new Promise(resolve => {
          setTimeout(() => {
            resolve(registerForPushNotifications(retryCount + 1));
          }, 2000); 
        });
      }
      
      console.log("TOKEN_REGISTER: Max retries exceeded, giving up");
      tokenRegistrationInProgress.current = false;
      return null;
    }
  };
  
  const determineNotificationType = (notification) => {
    if (notification.type) {
      return notification.type;
    }
    
    const title = notification.title || '';
    const message = notification.message || '';
    const combinedText = `${title} ${message}`.toLowerCase();
    
    if (
      combinedText.includes('order') || 
      /order\s+#[a-z0-9]+/i.test(combinedText) ||
      /order\s+id[:\s][a-z0-9]+/i.test(combinedText) ||
      /order\s+delivered|shipping|shipped|processing|confirmed/i.test(combinedText)
    ) {
      return 'order';
    }
    
    if (
      combinedText.includes('promo') || 
      combinedText.includes('discount') || 
      combinedText.includes('sale') || 
      combinedText.includes('deal') ||
      combinedText.includes(' off') ||
      combinedText.includes('special offer')
    ) {
      return 'promotion';
    }
    
    if (combinedText.includes('artwork') || combinedText.includes(' art ')) {
      return 'artwork';
    }
    
    if (
      combinedText.includes('art material') || 
      combinedText.includes('supply') ||
      combinedText.includes('supplies')
    ) {
      return 'artmat';
    }
    
    return 'default';
  };
  
  const extractOrderId = (notification) => {
    const title = notification.title || '';
    const message = notification.message || '';
    const combinedText = `${title} ${message}`;
    
    const orderIdPatterns = [
      /#([a-z0-9]{5,})/i,
      /order\s+#?([a-z0-9]{5,})/i,
      /order\s+id:?\s*([a-z0-9]{5,})/i,
      /order\s+number:?\s*([a-z0-9]{5,})/i
    ];
    
    for (const pattern of orderIdPatterns) {
      const match = combinedText.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  };
  
  const createNotificationKey = (notification) => {
    const type = determineNotificationType(notification);
    const title = notification.title || '';
    const message = notification.message || '';
    const id = notification._id || '';
    
    return `${id}-${type}-${title.substring(0, 20)}-${message.substring(0, 20)}`;
  };
  
  const wasNotificationPreviouslyDisplayed = (notification) => {
    const key = createNotificationKey(notification);
    return displayedNotifications.current.has(key);
  };
  
  const markNotificationAsDisplayed = (notification) => {
    const key = createNotificationKey(notification);
    const now = Date.now();
    
    displayedNotifications.current.set(key, now);
    
    // Clean up old notifications (over 30 days)
    displayedNotifications.current.forEach((time, storedKey) => {
      if ((now - time) > (30 * 24 * 60 * 60 * 1000)) {
        displayedNotifications.current.delete(storedKey);
      }
    });
    
    saveSeenNotifications();
    return true;
  };
  
  const checkOrderOwnership = async (orderId, currentUserId) => {
    if (!orderId || !currentUserId) {
      return false;
    }
    
    try {
      const orderData = await dispatch(getOrderDetails(orderId));
      
      if (orderData && orderData.user) {
        const orderUserId = typeof orderData.user === 'object' ? orderData.user._id : orderData.user;
        return orderUserId === currentUserId;
      }
      
      return false;
    } catch (error) {
      console.error("Error checking order ownership:", error);
      return false;
    }
  };
  
  const shouldUserReceiveNotification = async (notification, currentUserId) => {
    if (!currentUserId) {
      return false;
    }
    
    if (wasNotificationPreviouslyDisplayed(notification)) {
      return false;
    }
    
    if (notification.targetUserId) {
      return notification.targetUserId === currentUserId;
    }
    
    const type = determineNotificationType(notification);
    
    if (type === 'order') {
      const orderId = notification.orderId || extractOrderId(notification);
      
      if (!orderId) {
        return false;
      }
      
      return await checkOrderOwnership(orderId, currentUserId);
    }
    
    return true;
  };
  
  // Centralized token management function
  const ensureValidPushToken = async () => {
    // Already in progress, wait for it to complete
    if (tokenRegistrationInProgress.current) {
      return;
    }
    
    // Check if we need a new token
    const needsNewToken = !storedPushToken || isTokenExpired();
    
    if (needsNewToken) {
      await registerForPushNotifications();
    }
  };
  
  const fetchAndDisplayNotifications = async (force = false) => {
    const now = Date.now();
    const minTimeBetweenFetches = 5 * 60 * 1000; // 5 minutes
    
    if (
      !force && 
      (notificationFetchInProgress.current || now - lastFetchTime.current < minTimeBetweenFetches)
    ) {
      return;
    }
    
    notificationFetchInProgress.current = true;
    
    try {
      if (!userId || userRole !== 'user') {
        notificationFetchInProgress.current = false;
        return;
      }
      
      // Use centralized token management instead of duplicating logic
      await ensureValidPushToken();
      
      const notifications = await fetchNotifications(userRole);
      lastFetchTime.current = Date.now();
      
      if (!notifications || notifications.length === 0) {
        notificationFetchInProgress.current = false;
        return;
      }
      
      const sortedNotifications = notifications.sort((a, b) => 
        new Date(b.sentAt || Date.now()) - new Date(a.sentAt || Date.now())
      );
      
      const notificationsByType = {};
      sortedNotifications.forEach(notification => {
        const type = determineNotificationType(notification);
        
        if (!notificationsByType[type]) {
          notificationsByType[type] = [];
        }
        notificationsByType[type].push({
          ...notification,
          inferredType: type 
        });
      });
      
      for (const [type, typeNotifications] of Object.entries(notificationsByType)) {
        if (!typeNotifications.length) continue;
        
        const latestNotification = typeNotifications[0];
        
        const notificationTime = new Date(latestNotification.sentAt || Date.now()).getTime();
        const currentTime = new Date().getTime();
        const hoursDifference = (currentTime - notificationTime) / (1000 * 60 * 60);
        
        if (hoursDifference < 24) {
          const shouldReceive = await shouldUserReceiveNotification(latestNotification, userId);
          
          if (!shouldReceive) {
            continue;
          }
          
          let categoryIdentifier = type;
          let targetScreen = "NotificationView";
          let additionalData = {};
          
          if (type === 'order') {
            targetScreen = 'OrderDetails';
            const orderId = latestNotification.orderId || extractOrderId(latestNotification);
            if (orderId) {
              additionalData.orderId = orderId;
            }
          } else if (type === 'promotion') {
            targetScreen = 'NotificationView';
          } else if (type === 'artwork') {
            targetScreen = 'NotificationView';
            if (latestNotification.artworkId) {
              additionalData.artworkId = latestNotification.artworkId;
            }
          }
          
          try {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: latestNotification.title || 'New notification',
                body: latestNotification.message || '',
                data: { 
                  id: latestNotification._id, 
                  type: categoryIdentifier,
                  notificationId: latestNotification._id,
                  screen: targetScreen,
                  timestamp: new Date().toISOString(),
                  ...additionalData
                },
                sound: true,
                priority: 'high',
                vibrate: [0, 250, 250, 250],
                badge: typeNotifications.length,
                categoryIdentifier,
              },
              trigger: { seconds: 1 },
            });
            
            markNotificationAsDisplayed(latestNotification);
          } catch (error) {
            console.error("Failed to schedule notification:", error);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      notificationFetchInProgress.current = false;
    }
  };
  
  const navigateToNotification = (screen, params) => {
    try {
      if (navigation && navigation.navigate) {
        navigation.navigate(screen, params);
        return true;
      }
      
      if (navigationContext && navigationContext.navigate) {
        navigationContext.navigate(screen, params);
        return true;
      }
      
      if (global.navigate) {
        global.navigate(screen, params);
        return true;
      }
      
      setTimeout(() => {
        if (navigation && navigation.navigate) {
          navigation.navigate(screen, params);
        } else if (navigationContext && navigationContext.navigate) {
          navigationContext.navigate(screen, params);
        }
      }, 500);
      
      return false;
    } catch (error) {
      console.error("Navigation error:", error);
      return false;
    }
  };
  
  useEffect(() => {
    const notificationReceivedListener = Notifications.addNotificationReceivedListener(notification => {
      // We only need this for event tracking - no action required here
    });
    
    const notificationResponseListener = Notifications.addNotificationResponseReceivedListener(async response => {
      try {
        const data = response.notification.request.content.data;
        const notificationId = data?.notificationId;
        const notificationType = data?.type;
        const targetScreen = data?.screen || 'NotificationView';
        const orderId = data?.orderId;
        const artworkId = data?.artworkId;
        
        if (notificationId) {
          if (notificationType === 'order' && orderId) {
            if (await checkOrderOwnership(orderId, userId)) {
              navigateToNotification('OrderDetails', { orderId });
            }
          } else if (notificationType === 'artwork' && artworkId) {
            navigateToNotification('ArtworkDetails', { artworkId });
          } else {
            navigateToNotification(targetScreen, {
              notificationId,
              notificationType
            });
          }
        }
      } catch (error) {
        console.error("Error handling notification tap:", error);
      }
    });
    
    const appStateSubscription = AppState.addEventListener("change", nextAppState => {
      if (
        appState.current.match(/inactive|background/) && 
        nextAppState === "active" &&
        userId && 
        userRole === 'user'
      ) {
        // App has come to the foreground
        setTimeout(() => {
          fetchAndDisplayNotifications(true);
        }, 1000);
      }
      
      appState.current = nextAppState;
    });
    
    return () => {
      notificationReceivedListener && Notifications.removeNotificationSubscription(notificationReceivedListener);
      notificationResponseListener && Notifications.removeNotificationSubscription(notificationResponseListener);
      appStateSubscription && appStateSubscription.remove();
    };
  }, [navigation, navigationContext, userId, userRole]);
  
  useEffect(() => {
    // Handle user changes and initial setup
    if (userId !== previousUserId.current) {
      setupComplete.current = false;
      tokenRegistrationInitiated.current = false; // Reset the token registration flag on user change
      displayedNotifications.current.clear();
      previousUserId.current = userId;
      
      if (!userId) {
        Notifications.setBadgeCountAsync(0).catch(err => 
          console.error("Failed to reset badge count:", err)
        );
      } else {
        console.log(`TOKEN_USER: New user logged in (${userId}), loading seen notifications`);
        loadSeenNotifications();
      }
    }
    
    if (!userId || userRole !== 'user') {
      return;
    }
    
    if (setupComplete.current) {
      return;
    }
    
    // One-time setup for the user
    const setupNotifications = async () => {
      try {
        console.log("TOKEN_SETUP: Starting notification setup");
        
        // Use centralized token management
        await ensureValidPushToken();
        
        // Fetch notifications after a short delay
        setTimeout(() => {
          fetchAndDisplayNotifications(true);
          setupComplete.current = true;
        }, 1500);
      } catch (error) {
        console.error("TOKEN_SETUP: Error in notification setup:", error);
        
        // Retry setup after a delay if it failed
        setTimeout(() => {
          if (!setupComplete.current) {
            setupNotifications();
          }
        }, 30000);
      }
    };
    
    setupNotifications();
    
    // Set up polling intervals
    const fetchInterval = setInterval(() => {
      if (userId && userRole === 'user') {
        fetchAndDisplayNotifications();
      }
    }, 30 * 60 * 1000); // Every 30 minutes
    
    const cleanupInterval = setInterval(() => {
      if (userId) {
        cleanupTokens().catch(err => 
          console.error("TOKEN_CLEANUP: Failed to clean up old notification tokens:", err)
        );
      }
    }, 24 * 60 * 60 * 1000); // Daily
    
    return () => {
      clearInterval(fetchInterval);
      clearInterval(cleanupInterval);
    };
  }, [userId, userRole, storedPushToken, tokenExpires, dispatch]);
  
  return null;
};

export default NotificationHandler;