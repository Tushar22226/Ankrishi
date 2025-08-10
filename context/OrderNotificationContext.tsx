import React, { createContext, useState, useContext, useEffect } from 'react';
import database from '@react-native-firebase/database';
import { useAuth } from './AuthContext';

interface OrderNotificationContextType {
  hasPendingOrders: boolean;
  refreshPendingOrders: () => Promise<void>;
}

const OrderNotificationContext = createContext<OrderNotificationContextType | undefined>(undefined);

export const useOrderNotification = () => {
  const context = useContext(OrderNotificationContext);
  if (!context) {
    throw new Error('useOrderNotification must be used within an OrderNotificationProvider');
  }
  return context;
};

export const OrderNotificationProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [hasPendingOrders, setHasPendingOrders] = useState(false);
  const { userProfile } = useAuth();

  const refreshPendingOrders = async () => {
    if (!userProfile?.uid) return;

    try {
      // Check for pending orders where the user is the seller
      const ordersRef = database().ref('orders');
      const snapshot = await ordersRef
        .orderByChild('sellerId')
        .equalTo(userProfile.uid)
        .once('value');

      if (snapshot.exists()) {
        let pendingFound = false;
        snapshot.forEach((childSnapshot) => {
          const order = childSnapshot.val();
          if (order.status === 'pending') {
            pendingFound = true;
          }
          return pendingFound; // Stop iteration if we found a pending order
        });
        
        setHasPendingOrders(pendingFound);
      } else {
        setHasPendingOrders(false);
      }
    } catch (error) {
      console.error('Error checking for pending orders:', error);
      setHasPendingOrders(false);
    }
  };

  // Set up real-time listener for orders
  useEffect(() => {
    if (!userProfile?.uid) return;

    const ordersRef = database().ref('orders');
    const query = ordersRef.orderByChild('sellerId').equalTo(userProfile.uid);

    const onOrdersChange = (snapshot: any) => {
      if (snapshot.exists()) {
        let pendingFound = false;
        snapshot.forEach((childSnapshot: any) => {
          const order = childSnapshot.val();
          if (order.status === 'pending') {
            pendingFound = true;
          }
          return pendingFound; // Stop iteration if we found a pending order
        });
        
        setHasPendingOrders(pendingFound);
      } else {
        setHasPendingOrders(false);
      }
    };

    // Set up the listener
    query.on('value', onOrdersChange);

    // Initial check
    refreshPendingOrders();

    // Clean up the listener when the component unmounts
    return () => {
      query.off('value', onOrdersChange);
    };
  }, [userProfile]);

  const value = {
    hasPendingOrders,
    refreshPendingOrders
  };

  return <OrderNotificationContext.Provider value={value}>{children}</OrderNotificationContext.Provider>;
};
