import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../navigation/types';
import { useVehicles } from '../contexts/VehiclesContext';
import { homeStyles } from './dashboardStyles';

type Props = NativeStackScreenProps<MainStackParamList, 'ViewVehicles'>;

export const ViewVehiclesScreen: React.FC<Props> = ({ navigation }) => {
  const { vehicles } = useVehicles();

  return (
    <View style={homeStyles.container}>
      <StatusBar style="dark" />

      <View style={homeStyles.header}>
        <TouchableOpacity style={homeStyles.menuButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#0055FF" />
        </TouchableOpacity>
        <Text style={[homeStyles.locationText, { color: '#0055FF', fontSize: 20, fontWeight: 'bold' }]}>
          Meus Veículos
        </Text>
        <TouchableOpacity style={homeStyles.shareButton} onPress={() => navigation.navigate('AddVehicle', {})}>
          <Ionicons name="add" size={24} color="#0055FF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={homeStyles.scrollView} showsVerticalScrollIndicator={false}>
        {vehicles.length === 0 ? (
          <View style={homeStyles.emptyContainer}>
            <Ionicons name="car-outline" size={80} color="#CCCCCC" />
            <Text style={homeStyles.emptyText}>Nenhum veículo cadastrado</Text>
            <Text style={homeStyles.emptySubtext}>Toque no botão + para adicionar um veículo</Text>
            <TouchableOpacity style={homeStyles.addButton} onPress={() => navigation.navigate('AddVehicle', {})}>
              <Ionicons name="add" size={24} color="#FFFFFF" />
              <Text style={homeStyles.addButtonText}>Adicionar Veículo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={homeStyles.vehiclesList}>
            {vehicles.map((vehicle, index) => (
              <View key={index} style={homeStyles.vehicleItem}>
                <View style={homeStyles.vehicleItemContent}>
                  <View style={homeStyles.vehicleItemHeader}>
                    <Text style={homeStyles.vehicleItemPlaca}>{vehicle.placa}</Text>
                    <Text style={homeStyles.vehicleItemTipo}>{vehicle.tipo}</Text>
                  </View>
                  <Text style={homeStyles.vehicleItemModelo}>{vehicle.modelo}</Text>
                  <Text style={homeStyles.vehicleItemAno}>Ano: {vehicle.ano}</Text>
                  {vehicle.possuiSeguro && (
                    <View>
                      <View style={homeStyles.vehicleItemBadge}>
                        <Ionicons name="shield-checkmark" size={16} color="#4CAF50" />
                        <Text style={homeStyles.vehicleItemBadgeText}>Com Seguro</Text>
                      </View>
                      {vehicle.insurance && (
                        <View style={{ marginTop: 8 }}>
                          <Text style={homeStyles.vehicleItemInsurance}>Seguradora: {vehicle.insurance.company}</Text>
                          <Text style={homeStyles.vehicleItemInsurance}>Apolice: {vehicle.insurance.policyNumber}</Text>
                          <Text style={homeStyles.vehicleItemInsurance}>Validade: {vehicle.insurance.validUntil}</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  style={homeStyles.vehicleItemAction}
                  onPress={() => navigation.navigate('AddVehicle', { editIndex: index })}
                >
                  <Ionicons name="create-outline" size={24} color="#0055FF" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};
