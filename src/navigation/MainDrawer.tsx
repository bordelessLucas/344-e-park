import React from 'react';
import { Dimensions } from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { DrawerSidebar } from './DrawerSidebar';
import { MainStackWithLoadingGate } from './MainStack';

const Drawer = createDrawerNavigator();

export function MainDrawerNavigator() {
  const drawerWidth = Dimensions.get('window').width * 0.8;

  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerSidebar {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'slide',
        drawerStyle: { width: drawerWidth, backgroundColor: 'rgb(215, 239, 253)' },
        swipeEnabled: true,
        swipeEdgeWidth: 48,
        overlayColor: 'rgba(0, 0, 0, 0.5)',
      }}
    >
      <Drawer.Screen name="Root" component={MainStackWithLoadingGate} options={{ title: 'Início' }} />
    </Drawer.Navigator>
  );
}
