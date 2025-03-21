import React, { useEffect } from "react";
import { Alert } from "react-native";
import { useSelector } from "react-redux";
import { CommonActions } from "@react-navigation/native"; // Add this import

const withAuthCheck = (WrappedComponent) => {
  return (props) => {
    const user = useSelector((state) => state.auth.user);
    
    useEffect(() => {
      if (!user) {
        Alert.alert(
          "Login Required",
          "Please log in to access this feature.",
          [
            {
              text: "Cancel",
              style: "cancel",
              onPress: () => props.navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [
                    { 
                      name: "Shop",
                      params: { refresh: Date.now() } // Add timestamp param to force refresh
                    }
                  ],
                })
              )
            },
            {
              text: "Login",
              onPress: () => props.navigation.navigate("Login") // Navigate to login screen
            },
          ]
        );
      }
    }, [user]);
    
    // If the user is logged in, render the wrapped component
    return user ? <WrappedComponent {...props} /> : null;
  };
};

export default withAuthCheck;