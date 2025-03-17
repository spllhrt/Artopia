import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { getCartItems, updateCartItemQuantity, removeCartItem, clearCart } from '../../utils/cart';

const CartScreen = ({ navigation }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const user = useSelector((state) => state.auth.user);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  
  const userId = user?._id || 'default_user';

  const fetchCartItems = async () => {
    try {
      const items = await getCartItems(userId);
      setCartItems(items);
    } catch (error) {
      Alert.alert('Error', 'Failed to load cart items');
      console.error('Error loading cart items:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCartItems();
    
    // Refresh cart when navigating back to this screen
    const unsubscribe = navigation.addListener('focus', () => {
      fetchCartItems();
    });
  
    return unsubscribe;
  }, [navigation, isAuthenticated, userId]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCartItems();
  };

  const handleQuantityChange = async (cartId, currentQuantity, change, productType) => {
    // Prevent quantity changes for artwork items
    if (productType === 'artwork') {
      return;
    }
    
    const newQuantity = currentQuantity + change;
    
    try {
      await updateCartItemQuantity(cartId, newQuantity, userId);
      fetchCartItems(); // Refresh cart items after update
    } catch (error) {
      if (error.message === 'Requested quantity exceeds available stock') {
        Alert.alert('Error', 'Sorry, not enough stock available');
      } else {
        Alert.alert('Error', 'Failed to update quantity');
      }
      console.error('Error updating quantity:', error);
    }
  };

  const handleRemoveItem = async (cartId) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item from cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            try {
              await removeCartItem(cartId, userId);
              fetchCartItems(); // Refresh cart items after removal
            } catch (error) {
              Alert.alert('Error', 'Failed to remove item');
              console.error('Error removing item:', error);
            }
          }
        }
      ]
    );
  };

  const handleClearCart = () => {
    if (cartItems.length === 0) return;
    
    Alert.alert(
      'Clear Cart',
      'Are you sure you want to remove all items from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: async () => {
            try {
              await clearCart(userId);
              fetchCartItems(); // Refresh cart items after clearing
            } catch (error) {
              Alert.alert('Error', 'Failed to clear cart');
              console.error('Error clearing cart:', error);
            }
          }
        }
      ]
    );
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      Alert.alert('Empty Cart', 'Your cart is empty');
      return;
    }
    navigation.navigate('Cart', {screen: 'CheckoutScreen'});
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => {
      return sum + (item.product.price * item.quantity);
    }, 0).toFixed(2);
  };

  const renderCartItem = ({ item }) => {
    const isArtwork = item.productType === 'artwork';
    const title = isArtwork ? item.product.title : item.product.name;
    const subtitle = isArtwork ? item.product.artist : item.product.category;
    
    return (
      <View style={styles.cartItem}>
        <TouchableOpacity 
          onPress={() => {
            if (isArtwork) {
              navigation.navigate('ArtworkDetailScreen', { id: item.product.id });
            } else {
              navigation.navigate('ArtmatDetailScreen', { id: item.product.id });
            }
          }}
          style={styles.itemImageContainer}
        >
          <Image 
            source={item.product.imageUrl ? { uri: item.product.imageUrl } : null} 
            style={styles.itemImage} 
            />
        </TouchableOpacity>
        
        <View style={styles.itemDetails}>
          <Text style={styles.itemTitle} numberOfLines={1}>{title}</Text>
          <Text style={styles.itemSubtitle} numberOfLines={1}>{subtitle}</Text>
          <Text style={styles.itemPrice}>${item.product.price.toFixed(2)}</Text>
          
          {!isArtwork && (
            // Only show quantity controls for art materials
            <View style={styles.quantityContainer}>
              <TouchableOpacity 
                onPress={() => handleQuantityChange(item.cartId, item.quantity, -1, item.productType)}
                style={[styles.quantityButton, item.quantity === 1 && styles.quantityButtonDisabled]}
                disabled={item.quantity === 1}
              >
                <Ionicons name="remove" size={16} color={item.quantity === 1 ? "#CCC" : "#333"} />
              </TouchableOpacity>
              
              <Text style={styles.quantityText}>{item.quantity}</Text>
              
              <TouchableOpacity 
                onPress={() => handleQuantityChange(item.cartId, item.quantity, 1, item.productType)}
                style={styles.quantityButton}
                disabled={item.quantity >= item.product.stock}
              >
                <Ionicons name="add" size={16} color="#333" />
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        <TouchableOpacity 
          onPress={() => handleRemoveItem(item.cartId)}
          style={styles.removeButton}
        >
          <Ionicons name="trash-outline" size={22} color="#FF6B6B" />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#C4A77D" />
      </View>
    );
  }

  if (cartItems.length === 0) {
    return (
      <View style={styles.centered}>
        <Ionicons name="cart-outline" size={60} color="#CCC" />
        <Text style={styles.emptyCartText}>Your cart is empty</Text>
        <TouchableOpacity 
          style={styles.shopNowButton}
          onPress={() => navigation.navigate('Shop', { 
            screen: 'Shop', 
            params: { 
              screen: 'ShopMain' 
            }
          })}
        >
          <Text style={styles.shopNowText}>Shop Now</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={cartItems}
        keyExtractor={(item) => item.cartId.toString()}
        renderItem={renderCartItem}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        contentContainerStyle={styles.listContent}
      />
      
      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalAmount}>${calculateTotal()}</Text>
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.clearButton}
            onPress={handleClearCart}
          >
            <Text style={styles.clearButtonText}>Clear Cart</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.checkoutButton}
            onPress={handleCheckout}
          >
            <Text style={styles.checkoutButtonText}>Checkout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  emptyCartText: {
    fontSize: 18,
    marginTop: 16,
    color: '#666',
  },
  shopNowButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#C4A77D',
    borderRadius: 8,
  },
  shopNowText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cartItem: {
    flexDirection: 'row',
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#F8F8F8',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 6,
    overflow: 'hidden',
    marginRight: 12,
  },
  itemImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#C4A77D',
    marginBottom: 6,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EAEAEA',
    borderRadius: 12,
  },
  quantityButtonDisabled: {
    backgroundColor: '#F5F5F5',
  },
  quantityText: {
    paddingHorizontal: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  removeButton: {
    padding: 8,
    justifyContent: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    padding: 16,
    paddingBottom: 30, // Extra padding for bottom safe area
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    marginRight: 10,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  checkoutButton: {
    flex: 2,
    paddingVertical: 14,
    backgroundColor: '#C4A77D',
    borderRadius: 8,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CartScreen;