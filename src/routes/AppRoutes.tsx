import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Login, Register } from '../pages';
import { MainDrawerNavigator } from '../navigation/MainDrawer';
import type { RootStackParamList } from '../navigation/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const RegisterWrapper = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <Register
      onLogin={() => navigation.replace('Main')}
      onGoToLogin={() => navigation.navigate('Login')}
    />
  );
};

/** Alternativa ao `RootNavigator` em `App.tsx` — mesma árvore de telas. */
export const AppRoutes = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Login">
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Register" component={RegisterWrapper} />
        <Stack.Screen name="Main" component={MainDrawerNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
