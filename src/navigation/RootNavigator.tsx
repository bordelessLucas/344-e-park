import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Login } from '../pages/Login/Login';
import { Register } from '../pages/Register/Register';
import { useAuth } from '../hooks/useAuth';
import { MainDrawerNavigator } from './MainDrawer';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

function RegisterScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <Register
      onLogin={() => navigation.replace('Main')}
      onGoToLogin={() => navigation.navigate('Login')}
    />
  );
}

function AuthLoading() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color="#0055FF" />
      <Text style={styles.loadingText}>Carregando...</Text>
    </View>
  );
}

export function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return <AuthLoading />;
  }

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={user ? 'Main' : 'Login'}
    >
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Main" component={MainDrawerNavigator} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
});
