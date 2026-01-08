import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  Linking,
  Dimensions,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { VehicleData } from '../AddVehicle/AddVehicle';
import { BatteryProduct, BatteryOrder } from '../../types/battery';
import {
  MOURA_BATTERIES,
  saveBatteryOrder,
  getAllBatteryOrders,
  calculateDeliveryTime,
  MOURA_WEBSITE,
  MOURA_CONTACT_PHONE,
} from '../../services/batteryService';

interface BatteryServiceProps {
  onBack: () => void;
  vehicles?: VehicleData[];
}

const { width } = Dimensions.get('window');

export const BatteryService: React.FC<BatteryServiceProps> = ({ onBack, vehicles = [] }) => {
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleData | null>(null);
  const [selectedBattery, setSelectedBattery] = useState<BatteryProduct | null>(null);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showBatteryModal, setShowBatteryModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showMyOrders, setShowMyOrders] = useState(false);
  const [myOrders, setMyOrders] = useState<BatteryOrder[]>([]);

  // Form fields
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    const orders = await getAllBatteryOrders();
    setMyOrders(orders.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()));
  };

  const getFilteredBatteries = (): BatteryProduct[] => {
    if (!selectedVehicle) return MOURA_BATTERIES;
    return MOURA_BATTERIES.filter(battery => 
      battery.vehicleTypes.includes(selectedVehicle.tipo)
    );
  };

  const handleSelectBattery = (battery: BatteryProduct) => {
    setSelectedBattery(battery);
    setShowBatteryModal(false);
  };

  const handleOrderNow = () => {
    if (!selectedBattery) {
      Alert.alert('Atenção', 'Selecione uma bateria primeiro');
      return;
    }
    setShowOrderModal(true);
  };

  const validateForm = (): boolean => {
    if (!customerName.trim()) {
      Alert.alert('Erro', 'Informe seu nome');
      return false;
    }
    if (!customerPhone.trim()) {
      Alert.alert('Erro', 'Informe seu telefone');
      return false;
    }
    if (!customerAddress.trim()) {
      Alert.alert('Erro', 'Informe o endereço de entrega');
      return false;
    }
    return true;
  };

  const handleConfirmOrder = async () => {
    if (!validateForm() || !selectedBattery) return;

    try {
      const deliveryTime = calculateDeliveryTime();
      const now = new Date();
      const estimatedDelivery = new Date(now.getTime() + parseInt(deliveryTime) * 60000);

      const order = await saveBatteryOrder({
        batteryId: selectedBattery.id,
        batteryName: `${selectedBattery.name} ${selectedBattery.model}`,
        vehiclePlaca: selectedVehicle?.placa,
        vehicleModel: selectedVehicle?.modelo,
        customerName,
        customerPhone,
        customerAddress,
        deliveryTime,
        price: selectedBattery.price,
        estimatedDelivery: estimatedDelivery.toISOString(),
      });

      setShowOrderModal(false);
      resetForm();
      
      Alert.alert(
        'Pedido Realizado! 🎉',
        `Seu pedido foi confirmado!\n\nEntrega estimada: ${deliveryTime}\n\nValor: R$ ${selectedBattery.price.toFixed(2)}\n\nA Baterias Moura entrará em contato em breve.`,
        [
          {
            text: 'Ver Meus Pedidos',
            onPress: () => {
              loadOrders();
              setShowMyOrders(true);
            },
          },
          { text: 'OK' },
        ]
      );
    } catch (error) {
      Alert.alert('Erro', 'Erro ao realizar pedido. Tente novamente.');
    }
  };

  const resetForm = () => {
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
  };

  const openMouraWebsite = () => {
    Linking.openURL(MOURA_WEBSITE).catch(() => {
      Alert.alert('Erro', 'Não foi possível abrir o site da Moura');
    });
  };

  const callMoura = () => {
    Linking.openURL(`tel:${MOURA_CONTACT_PHONE}`).catch(() => {
      Alert.alert('Erro', 'Não foi possível fazer a ligação');
    });
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusLabel = (status: BatteryOrder['status']): string => {
    const labels = {
      pending: 'Pendente',
      confirmed: 'Confirmado',
      delivering: 'Em Entrega',
      delivered: 'Entregue',
      cancelled: 'Cancelado',
    };
    return labels[status];
  };

  const getStatusColor = (status: BatteryOrder['status']): string => {
    const colors = {
      pending: '#FF9800',
      confirmed: '#2196F3',
      delivering: '#9C27B0',
      delivered: '#4CAF50',
      cancelled: '#F44336',
    };
    return colors[status];
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0055FF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Baterias Moura</Text>
        <TouchableOpacity onPress={() => {
          loadOrders();
          setShowMyOrders(true);
        }} style={styles.ordersButton}>
          <Ionicons name="receipt-outline" size={24} color="#0055FF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <Ionicons name="battery-charging" size={32} color="#0055FF" />
          </View>
          <Text style={styles.infoTitle}>Baterias Moura</Text>
          <Text style={styles.infoSubtitle}>Entrega em 50 min</Text>
          <Text style={styles.infoText}>
            Baterias de qualidade entregues rapidamente no conforto da sua casa ou trabalho.
          </Text>
        </View>

        {/* Vehicle Selector (Optional) */}
        {vehicles.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Selecione seu Veículo (Opcional)</Text>
            <TouchableOpacity
              style={styles.selector}
              onPress={() => setShowVehicleModal(true)}
            >
              {selectedVehicle ? (
                <View style={styles.selectedItem}>
                  <Ionicons
                    name={selectedVehicle.tipo === 'Carro' ? 'car' : 'bicycle'}
                    size={24}
                    color="#0055FF"
                  />
                  <View style={styles.selectedInfo}>
                    <Text style={styles.selectedPlaca}>{selectedVehicle.placa}</Text>
                    <Text style={styles.selectedModelo}>
                      {selectedVehicle.modelo} • {selectedVehicle.ano}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.placeholderContainer}>
                  <Ionicons name="car-outline" size={24} color="#999" />
                  <Text style={styles.placeholder}>Escolher veículo</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        )}

        {/* Battery Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Escolha a Bateria</Text>
          <TouchableOpacity
            style={styles.selector}
            onPress={() => setShowBatteryModal(true)}
          >
            {selectedBattery ? (
              <View style={styles.selectedItem}>
                <Ionicons name="battery-charging" size={24} color="#0055FF" />
                <View style={styles.selectedInfo}>
                  <Text style={styles.selectedPlaca}>
                    {selectedBattery.name} {selectedBattery.model}
                  </Text>
                  <Text style={styles.selectedModelo}>
                    {selectedBattery.amperage} • {selectedBattery.voltage} • R$ {selectedBattery.price.toFixed(2)}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.placeholderContainer}>
                <Ionicons name="battery-half-outline" size={24} color="#999" />
                <Text style={styles.placeholder}>Selecione uma bateria</Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Selected Battery Details */}
        {selectedBattery && (
          <View style={styles.batteryDetails}>
            <Text style={styles.detailsTitle}>Detalhes da Bateria</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Modelo:</Text>
              <Text style={styles.detailValue}>{selectedBattery.model}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Amperagem:</Text>
              <Text style={styles.detailValue}>{selectedBattery.amperage}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Voltagem:</Text>
              <Text style={styles.detailValue}>{selectedBattery.voltage}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Garantia:</Text>
              <Text style={styles.detailValue}>{selectedBattery.warranty}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Preço:</Text>
              <Text style={[styles.detailValue, styles.priceValue]}>
                R$ {selectedBattery.price.toFixed(2)}
              </Text>
            </View>
            <Text style={styles.description}>{selectedBattery.description}</Text>

            <TouchableOpacity style={styles.orderButton} onPress={handleOrderNow}>
              <Ionicons name="cart" size={20} color="#FFF" />
              <Text style={styles.orderButtonText}>Solicitar Agora</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Contact Moura */}
        <View style={styles.contactSection}>
          <Text style={styles.sectionTitle}>Precisa de Ajuda?</Text>
          <TouchableOpacity style={styles.contactButton} onPress={callMoura}>
            <Ionicons name="call" size={20} color="#0055FF" />
            <Text style={styles.contactButtonText}>Ligar para Moura: {MOURA_CONTACT_PHONE}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactButton} onPress={openMouraWebsite}>
            <Ionicons name="globe" size={20} color="#0055FF" />
            <Text style={styles.contactButtonText}>Visitar Site da Moura</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Vehicle Selection Modal */}
      <Modal
        visible={showVehicleModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowVehicleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecione o Veículo</Text>
              <TouchableOpacity onPress={() => setShowVehicleModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <TouchableOpacity
                style={styles.vehicleOption}
                onPress={() => {
                  setSelectedVehicle(null);
                  setShowVehicleModal(false);
                }}
              >
                <Text style={styles.vehicleOptionText}>Nenhum (ver todas)</Text>
                {!selectedVehicle && (
                  <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                )}
              </TouchableOpacity>
              {vehicles.map((vehicle) => (
                <TouchableOpacity
                  key={vehicle.placa}
                  style={styles.vehicleOption}
                  onPress={() => {
                    setSelectedVehicle(vehicle);
                    setShowVehicleModal(false);
                  }}
                >
                  <View style={styles.vehicleOptionContent}>
                    <Ionicons
                      name={vehicle.tipo === 'Carro' ? 'car' : 'bicycle'}
                      size={24}
                      color="#0055FF"
                    />
                    <View style={styles.vehicleOptionInfo}>
                      <Text style={styles.vehicleOptionPlaca}>{vehicle.placa}</Text>
                      <Text style={styles.vehicleOptionModelo}>
                        {vehicle.modelo} • {vehicle.ano}
                      </Text>
                    </View>
                  </View>
                  {selectedVehicle?.placa === vehicle.placa && (
                    <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Battery Selection Modal */}
      <Modal
        visible={showBatteryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBatteryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Escolha a Bateria</Text>
              <TouchableOpacity onPress={() => setShowBatteryModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {getFilteredBatteries().map((battery) => (
                <TouchableOpacity
                  key={battery.id}
                  style={styles.batteryOption}
                  onPress={() => handleSelectBattery(battery)}
                >
                  <View style={styles.batteryOptionContent}>
                    <Ionicons name="battery-charging" size={28} color="#0055FF" />
                    <View style={styles.batteryOptionInfo}>
                      <Text style={styles.batteryOptionName}>
                        {battery.name} {battery.model}
                      </Text>
                      <Text style={styles.batteryOptionSpecs}>
                        {battery.amperage} • {battery.voltage} • {battery.warranty}
                      </Text>
                      <Text style={styles.batteryOptionPrice}>
                        R$ {battery.price.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                  {selectedBattery?.id === battery.id && (
                    <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Order Form Modal */}
      <Modal
        visible={showOrderModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowOrderModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Finalizar Pedido</Text>
              <TouchableOpacity onPress={() => setShowOrderModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.formScroll}>
              {selectedBattery && (
                <View style={styles.orderSummary}>
                  <Text style={styles.orderSummaryTitle}>Resumo do Pedido</Text>
                  <Text style={styles.orderSummaryText}>
                    {selectedBattery.name} {selectedBattery.model}
                  </Text>
                  <Text style={styles.orderSummaryPrice}>
                    R$ {selectedBattery.price.toFixed(2)}
                  </Text>
                </View>
              )}

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Nome Completo *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Seu nome"
                  placeholderTextColor="#999"
                  value={customerName}
                  onChangeText={setCustomerName}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Telefone *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="(00) 00000-0000"
                  placeholderTextColor="#999"
                  value={customerPhone}
                  onChangeText={setCustomerPhone}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Endereço de Entrega *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Rua, número, complemento, bairro, cidade"
                  placeholderTextColor="#999"
                  value={customerAddress}
                  onChangeText={setCustomerAddress}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmOrder}>
                <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                <Text style={styles.confirmButtonText}>Confirmar Pedido</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* My Orders Modal */}
      <Modal
        visible={showMyOrders}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMyOrders(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Meus Pedidos</Text>
              <TouchableOpacity onPress={() => setShowMyOrders(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {myOrders.length === 0 ? (
                <View style={styles.emptyOrders}>
                  <Ionicons name="receipt-outline" size={64} color="#CCC" />
                  <Text style={styles.emptyOrdersText}>Nenhum pedido realizado</Text>
                </View>
              ) : (
                myOrders.map((order) => (
                  <View key={order.id} style={styles.orderCard}>
                    <View style={styles.orderHeader}>
                      <Text style={styles.orderNumber}>Pedido #{order.id.slice(-6)}</Text>
                      <View
                        style={[
                          styles.orderStatus,
                          { backgroundColor: getStatusColor(order.status) + '20' },
                        ]}
                      >
                        <Text style={[styles.orderStatusText, { color: getStatusColor(order.status) }]}>
                          {getStatusLabel(order.status)}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.orderBattery}>{order.batteryName}</Text>
                    <Text style={styles.orderDate}>{formatDate(order.orderDate)}</Text>
                    <Text style={styles.orderDelivery}>
                      Entrega estimada: {order.deliveryTime}
                    </Text>
                    <Text style={styles.orderPrice}>R$ {order.price.toFixed(2)}</Text>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgb(215, 239, 253)',
    paddingTop: 48,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  ordersButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  infoCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  infoSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0055FF',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  selectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectedInfo: {
    marginLeft: 12,
    flex: 1,
  },
  selectedPlaca: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0055FF',
  },
  selectedModelo: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  placeholderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  placeholder: {
    fontSize: 16,
    color: '#999',
    marginLeft: 12,
  },
  batteryDetails: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  priceValue: {
    fontSize: 18,
    color: '#4CAF50',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
    marginBottom: 16,
    lineHeight: 20,
  },
  orderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0055FF',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 8,
  },
  orderButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginLeft: 8,
  },
  contactSection: {
    marginHorizontal: 20,
    marginBottom: 32,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 14,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  contactButtonText: {
    fontSize: 14,
    color: '#0055FF',
    marginLeft: 12,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  vehicleOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  vehicleOptionText: {
    fontSize: 16,
    color: '#333',
  },
  vehicleOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  vehicleOptionInfo: {
    marginLeft: 12,
  },
  vehicleOptionPlaca: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0055FF',
  },
  vehicleOptionModelo: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  batteryOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  batteryOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  batteryOptionInfo: {
    marginLeft: 12,
    flex: 1,
  },
  batteryOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  batteryOptionSpecs: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  batteryOptionPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 4,
  },
  formScroll: {
    padding: 20,
  },
  orderSummary: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  orderSummaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  orderSummaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  orderSummaryPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#FFF',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginLeft: 8,
  },
  emptyOrders: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyOrdersText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  orderCard: {
    backgroundColor: '#F9F9F9',
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#0055FF',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  orderStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  orderStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderBattery: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  orderDelivery: {
    fontSize: 13,
    color: '#0055FF',
    marginBottom: 6,
  },
  orderPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
});
