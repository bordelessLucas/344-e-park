import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from '../contexts/AuthContext';
import { VehiclesProvider } from '../contexts/VehiclesContext';
import { navigationRef } from '../navigation/navigationRef';
import { RootNavigator } from '../navigation/RootNavigator';

function App() {
  return (
    <AuthProvider>
      <VehiclesProvider>
        <NavigationContainer ref={navigationRef}>
          <RootNavigator />
        </NavigationContainer>
      </VehiclesProvider>
      <StatusBar style="auto" />
    </AuthProvider>
  );
}

export default App;
