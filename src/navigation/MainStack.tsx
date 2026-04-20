import React from 'react';
import { Alert, ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useRoute } from '@react-navigation/native';
import { HomeScreen } from '../screens/HomeScreen';
import { ViewVehiclesScreen } from '../screens/ViewVehiclesScreen';
import { AddVehicle, type VehicleData } from '../pages/AddVehicle/AddVehicle';
import { Payment } from '../pages/Payment/Payment';
import { MarketValue } from '../pages/MarketValue/MarketValue';
import { Insurance } from '../pages/Insurance/Insurance';
import { IPVAAndFines } from '../pages/IPVAAndFines/IPVAAndFines';
import { DriverLicensePage } from '../pages/DriverLicense/DriverLicense';
import { BatteryService } from '../pages/BatteryService/BatteryService';
import { FuelStations } from '../pages/FuelStations/FuelStations';
import { ParkingTicketPage } from '../pages/ParkingTicket/ParkingTicket';
import { PaymentSettings } from '../pages/PaymentSettings/PaymentSettings';
import { Profile } from '../pages/Profile/Profile';
import { Address } from '../pages/Address/Address';
import { useAuth } from '../hooks/useAuth';
import { useVehicles } from '../contexts/VehiclesContext';
import { signOutAndGoToLogin } from './navigationRef';
import type { MainStackParamList } from './types';

const Stack = createNativeStackNavigator<MainStackParamList>();

function AddVehicleScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const route = useRoute<RouteProp<MainStackParamList, 'AddVehicle'>>();
  const { user } = useAuth();
  const { vehicles, saveVehicle } = useVehicles();
  const editIndex = route.params?.editIndex;
  const initialVehicle = editIndex !== undefined ? vehicles[editIndex] ?? null : null;

  const handleCancel = () => {
    if (editIndex !== undefined) {
      navigation.navigate('ViewVehicles');
    } else {
      navigation.navigate('Home');
    }
  };

  const handleAdd = (vehicleData: VehicleData) => {
    void (async () => {
      if (!user) {
        Alert.alert('Erro', 'Você precisa estar logado para salvar um veículo.');
        return;
      }
      try {
        await saveVehicle(vehicleData, editIndex);
        Alert.alert(
          'Sucesso',
          editIndex !== undefined ? 'Veículo atualizado com sucesso!' : 'Veículo adicionado com sucesso!'
        );
        navigation.navigate('ViewVehicles');
      } catch {
        Alert.alert('Erro', 'Não foi possível salvar o veículo no servidor. Tente novamente.');
      }
    })();
  };

  return (
    <AddVehicle
      onCancel={handleCancel}
      onAdd={handleAdd}
      initialVehicle={initialVehicle}
      title={editIndex !== undefined ? 'Editar veículo' : 'Adicionar veículo'}
      submitLabel={editIndex !== undefined ? 'Salvar alterações' : 'Adicionar'}
    />
  );
}

function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { vehicles } = useVehicles();

  return (
    <Profile
      onBack={() => navigation.goBack()}
      onViewVehicles={() => navigation.navigate('ViewVehicles')}
      onPaymentSettings={() => navigation.navigate('PaymentSettings')}
      onAddress={() => navigation.navigate('Address')}
      onLoggedOut={signOutAndGoToLogin}
      vehicleCount={vehicles.length}
    />
  );
}

function MarketValueScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { vehicles } = useVehicles();
  return <MarketValue onBack={() => navigation.goBack()} vehicles={vehicles} />;
}

function InsuranceScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { vehicles } = useVehicles();
  return <Insurance onBack={() => navigation.goBack()} vehicles={vehicles} />;
}

function IPVAAndFinesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { vehicles } = useVehicles();
  return <IPVAAndFines onBack={() => navigation.goBack()} vehicles={vehicles} />;
}

function BatteryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { vehicles } = useVehicles();
  return <BatteryService onBack={() => navigation.goBack()} vehicles={vehicles} />;
}

function PaymentScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  return <Payment onBack={() => navigation.goBack()} />;
}

function PaymentSettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  return <PaymentSettings onBack={() => navigation.goBack()} />;
}

function AddressScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  return <Address onBack={() => navigation.navigate('Profile')} />;
}

function DriverLicenseScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  return <DriverLicensePage onBack={() => navigation.goBack()} />;
}

function FuelScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  return <FuelStations onBack={() => navigation.goBack()} />;
}

function ParkingTicketScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  return <ParkingTicketPage onBack={() => navigation.goBack()} />;
}

export function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="AddVehicle" component={AddVehicleScreen} />
      <Stack.Screen name="ViewVehicles" component={ViewVehiclesScreen} />
      <Stack.Screen name="Payment" component={PaymentScreen} />
      <Stack.Screen name="PaymentSettings" component={PaymentSettingsScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Address" component={AddressScreen} />
      <Stack.Screen name="MarketValue" component={MarketValueScreen} />
      <Stack.Screen name="Insurance" component={InsuranceScreen} />
      <Stack.Screen name="IPVAAndFines" component={IPVAAndFinesScreen} />
      <Stack.Screen name="DriverLicense" component={DriverLicenseScreen} />
      <Stack.Screen name="Battery" component={BatteryScreen} />
      <Stack.Screen name="Fuel" component={FuelScreen} />
      <Stack.Screen name="ParkingTicket" component={ParkingTicketScreen} />
    </Stack.Navigator>
  );
}

export function MainStackWithLoadingGate() {
  const { vehiclesLoaded } = useVehicles();
  if (!vehiclesLoaded) {
    return (
      <View style={gateStyles.centered}>
        <ActivityIndicator size="large" color="#0055FF" />
        <Text style={gateStyles.loadingText}>Carregando...</Text>
      </View>
    );
  }
  return <MainStack />;
}

const gateStyles = StyleSheet.create({
  centered: {
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
