import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator, 
  SafeAreaView
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { createOrderFromCart } from '../../api/orderApi';
import { clearCart, getCartItems } from '../../utils/cart';
import { TextInput } from 'react-native-gesture-handler';

const CheckoutScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [shippingInfo, setShippingInfo] = useState({
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    phoneNo: '',
  });
  const userId = useSelector(state => state.auth.user?._id);

  useEffect(() => {
    // Fetch cart items
    const fetchCartItems = async () => {
      try {
        if (userId) {
          const items = await getCartItems(userId);
          setCartItems(items);
          
          // Calculate total
          const total = items.reduce((sum, item) => {
            return sum + (item.product.price * item.quantity);
          }, 0);
          
          setTotalAmount(total);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to load cart items');
        console.error(error);
      }
    };

    fetchCartItems();
  }, [userId]);

  const handleInputChange = (name, value) => {
    setShippingInfo({
      ...shippingInfo,
      [name]: value
    });
  };

  const validateForm = () => {
    const { address, city, state, country, postalCode, phoneNo } = shippingInfo;
    if (!address || !city || !state || !country || !postalCode || !phoneNo) {
      Alert.alert('Error', 'Please fill all shipping details');
      return false;
    }
    return true;
  };
  const handleSubmitOrder = async () => {
    try {
      if (!validateForm()) return;
      
      setLoading(true);
      
      // Transform cart items to meet the backend requirements
      const transformedCartItems = cartItems.map(item => {
        return {
          ...item,
          product: {
            ...item.product,
            // Create the images array structure that the backend expects
            images: [{ url: item.product.imageUrl }]
          }
        };
      });
      
      const orderData = {
        shippingInfo,
        cartItems: transformedCartItems, // Use the transformed items
        taxAmount: totalAmount * 0.1,
        shippingAmount: 10,
        totalAmount: totalAmount + (totalAmount * 0.1) + 10,
      };
  
      // Create order from cart
      const createdOrder = await dispatch(createOrderFromCart(orderData));
      
      // Rest of your function remains the same
      if (createdOrder && userId) {
        await clearCart(userId);
      }
      
      Alert.alert(
        'Success', 
        'Your order has been placed successfully!',
        [
          { 
            text: 'View Order', 
            onPress: () => navigation.navigate('OrderDetails', { orderId: createdOrder._id }) 
          },
          { 
            text: 'Continue Shopping', 
            onPress: () => navigation.navigate('Home') 
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to place order');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Processing your order...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>Checkout</Text>
        
        {/* Order Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Summary</Text>
          <View style={styles.divider} />
          
          {cartItems.length === 0 ? (
            <Text style={styles.emptyCart}>Your cart is empty</Text>
          ) : (
            cartItems.map(item => (
              <View key={item.cartId} style={styles.cartItem}>
                <Text style={styles.itemName}>
                  {item.productType === 'artwork' ? item.product.title : item.product.name}
                </Text>
                <Text style={styles.itemPrice}>
                  ${item.product.price} x {item.quantity} = ${(item.product.price * item.quantity).toFixed(2)}
                </Text>
              </View>
            ))
          )}
          
          <View style={styles.divider} />
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalAmount}>${totalAmount.toFixed(2)}</Text>
          </View>
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Tax (10%):</Text>
            <Text style={styles.totalAmount}>${(totalAmount * 0.1).toFixed(2)}</Text>
          </View>
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Shipping:</Text>
            <Text style={styles.totalAmount}>$10.00</Text>
          </View>
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.grandTotal}>${(totalAmount + (totalAmount * 0.1) + 10).toFixed(2)}</Text>
          </View>
        </View>
        
        {/* Shipping Information */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Shipping Information</Text>
          <View style={styles.divider} />
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Address</Text>
            <TextInput
              style={styles.input}
              value={shippingInfo.address}
              onChangeText={(text) => handleInputChange('address', text)}
              placeholder="Street Address"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>City</Text>
            <TextInput
              style={styles.input}
              value={shippingInfo.city}
              onChangeText={(text) => handleInputChange('city', text)}
              placeholder="City"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>State</Text>
            <TextInput
              style={styles.input}
              value={shippingInfo.state}
              onChangeText={(text) => handleInputChange('state', text)}
              placeholder="State"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Country</Text>
            <TextInput
              style={styles.input}
              value={shippingInfo.country}
              onChangeText={(text) => handleInputChange('country', text)}
              placeholder="Country"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Postal Code</Text>
            <TextInput
              style={styles.input}
              value={shippingInfo.postalCode}
              onChangeText={(text) => handleInputChange('postalCode', text)}
              placeholder="Postal Code"
              keyboardType="numeric"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={shippingInfo.phoneNo}
              onChangeText={(text) => handleInputChange('phoneNo', text)}
              placeholder="Phone Number"
              keyboardType="phone-pad"
            />
          </View>
        </View>
        {/* Checkout Button */}
        <TouchableOpacity
          style={[
            styles.checkoutButton,
            cartItems.length === 0 && styles.disabledButton
          ]}
          onPress={handleSubmitOrder}
          disabled={cartItems.length === 0}
        >
          <Text style={styles.checkoutButtonText}>
            Place Order
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    padding: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 20,
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 15,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginVertical: 10,
  },
  emptyCart: {
    textAlign: 'center',
    fontSize: 16,
    color: '#888',
    marginVertical: 20,
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  itemName: {
    fontSize: 16,
    flex: 1,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '500',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5,
  },
  totalLabel: {
    fontSize: 16,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '500',
  },
  grandTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0066cc',
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
  },
  checkoutButton: {
    backgroundColor: '#0066cc',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginVertical: 20,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  checkoutButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default CheckoutScreen;