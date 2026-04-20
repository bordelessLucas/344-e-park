import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { headerIconButton } from '../../theme/touchTargets';
import { ParkingTicket, TicketPayment } from '../../types/parkingTicket';
import {
  getTicketByCode,
  payTicket,
  getPaymentHistory,
  formatDuration,
  getParkingTypeLabel,
  getParkingTypeColor,
} from '../../services/parkingTicketService';

interface ParkingTicketPageProps {
  onBack: () => void;
}

const { width } = Dimensions.get('window');

export const ParkingTicketPage: React.FC<ParkingTicketPageProps> = ({ onBack }) => {
  const [ticketCode, setTicketCode] = useState('');
  const [currentTicket, setCurrentTicket] = useState<ParkingTicket | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<ParkingTicket[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<TicketPayment['paymentMethod']>('pix');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const history = await getPaymentHistory();
    setPaymentHistory(history.sort((a, b) => 
      new Date(b.paymentDate || '').getTime() - new Date(a.paymentDate || '').getTime()
    ));
  };

  const handleSearchTicket = async () => {
    if (!ticketCode.trim()) {
      Alert.alert('Atenção', 'Digite o código do ticket');
      return;
    }

    setIsLoading(true);
    try {
      const ticket = await getTicketByCode(ticketCode);
      if (ticket) {
        setCurrentTicket(ticket);
      } else {
        Alert.alert('Erro', 'Ticket não encontrado');
      }
    } catch (error) {
      Alert.alert('Erro', 'Erro ao buscar ticket');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!currentTicket) return;

    try {
      await payTicket(currentTicket, selectedPaymentMethod);
      setShowPaymentModal(false);
      
      Alert.alert(
        'Pagamento Confirmado! ✅',
        `Seu pagamento de R$ ${currentTicket.totalAmount.toFixed(2)} foi processado com sucesso!`,
        [
          {
            text: 'Ver Histórico',
            onPress: () => {
              loadHistory();
              setShowHistoryModal(true);
              setCurrentTicket(null);
              setTicketCode('');
            },
          },
          {
            text: 'OK',
            onPress: () => {
              setCurrentTicket(null);
              setTicketCode('');
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Erro', 'Erro ao processar pagamento');
    }
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

  const paymentMethods = [
    { id: 'pix', label: 'PIX', icon: 'logo-bitcoin' },
    { id: 'credit', label: 'Crédito', icon: 'card' },
    { id: 'debit', label: 'Débito', icon: 'card-outline' },
    { id: 'money', label: 'Dinheiro', icon: 'cash' },
  ] as const;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0055FF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pagar Garagens</Text>
        <TouchableOpacity 
          onPress={() => {
            loadHistory();
            setShowHistoryModal(true);
          }} 
          style={styles.historyButton}
        >
          <Ionicons name="time-outline" size={24} color="#0055FF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <Ionicons name="business" size={32} color="#0055FF" />
          </View>
          <Text style={styles.infoTitle}>Pague Seu Ticket de Estacionamento</Text>
          <Text style={styles.infoText}>
            Shoppings, garagens, zona azul, eventos e aeroportos. Digite o código do seu ticket para pagar.
          </Text>
        </View>

        {/* Ticket Code Input */}
        <View style={styles.searchSection}>
          <Text style={styles.sectionTitle}>Código do Ticket</Text>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Ex: SHP123456, GAR789012"
              placeholderTextColor="#999"
              value={ticketCode}
              onChangeText={setTicketCode}
              autoCapitalize="characters"
            />
            <TouchableOpacity 
              style={styles.searchButton}
              onPress={handleSearchTicket}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Ionicons name="search" size={20} color="#FFF" />
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.helperText}>
            O código está impresso no seu ticket físico ou digital
          </Text>
        </View>

        {/* Quick Examples */}
        <View style={styles.examplesSection}>
          <Text style={styles.sectionTitle}>Exemplos de Códigos</Text>
          <View style={styles.examplesGrid}>
            {['SHP123456', 'GAR789012', 'ZON456789', 'EVT321654'].map((code) => (
              <TouchableOpacity
                key={code}
                style={styles.exampleChip}
                onPress={() => setTicketCode(code)}
              >
                <Text style={styles.exampleChipText}>{code}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Current Ticket Display */}
        {currentTicket && (
          <View style={styles.ticketCard}>
            <View style={styles.ticketHeader}>
              <View style={[styles.ticketTypeIcon, { backgroundColor: getParkingTypeColor(currentTicket.type) + '20' }]}>
                <Ionicons 
                  name={currentTicket.type === 'shopping' ? 'bag' : 
                        currentTicket.type === 'garage' ? 'business' : 
                        currentTicket.type === 'street' ? 'car' : 
                        currentTicket.type === 'event' ? 'musical-notes' : 'airplane'} 
                  size={28} 
                  color={getParkingTypeColor(currentTicket.type)} 
                />
              </View>
              <View style={styles.ticketHeaderInfo}>
                <Text style={styles.ticketLocation}>{currentTicket.locationName}</Text>
                <View style={[styles.ticketTypeBadge, { backgroundColor: getParkingTypeColor(currentTicket.type) + '20' }]}>
                  <Text style={[styles.ticketTypeBadgeText, { color: getParkingTypeColor(currentTicket.type) }]}>
                    {getParkingTypeLabel(currentTicket.type)}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.ticketDivider} />

            <View style={styles.ticketDetails}>
              <View style={styles.ticketDetailRow}>
                <Ionicons name="location" size={16} color="#666" />
                <Text style={styles.ticketDetailLabel}>Endereço:</Text>
                <Text style={styles.ticketDetailValue}>{currentTicket.address}</Text>
              </View>

              <View style={styles.ticketDetailRow}>
                <Ionicons name="enter-outline" size={16} color="#666" />
                <Text style={styles.ticketDetailLabel}>Entrada:</Text>
                <Text style={styles.ticketDetailValue}>{formatDate(currentTicket.entryTime)}</Text>
              </View>

              {currentTicket.duration && (
                <View style={styles.ticketDetailRow}>
                  <Ionicons name="time-outline" size={16} color="#666" />
                  <Text style={styles.ticketDetailLabel}>Permanência:</Text>
                  <Text style={styles.ticketDetailValue}>{formatDuration(currentTicket.duration)}</Text>
                </View>
              )}

              <View style={styles.ticketDetailRow}>
                <Ionicons name="cash-outline" size={16} color="#666" />
                <Text style={styles.ticketDetailLabel}>Valor/hora:</Text>
                <Text style={styles.ticketDetailValue}>R$ {currentTicket.pricePerHour.toFixed(2)}</Text>
              </View>
            </View>

            <View style={styles.ticketDivider} />

            <View style={styles.ticketTotal}>
              <Text style={styles.ticketTotalLabel}>VALOR TOTAL</Text>
              <Text style={styles.ticketTotalValue}>R$ {currentTicket.totalAmount.toFixed(2)}</Text>
            </View>

            <TouchableOpacity 
              style={styles.payButton}
              onPress={() => setShowPaymentModal(true)}
            >
              <Ionicons name="card" size={20} color="#FFF" />
              <Text style={styles.payButtonText}>Pagar Agora</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Payment Method Modal */}
      <Modal
        visible={showPaymentModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Escolha a Forma de Pagamento</Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.paymentMethodsContainer}>
              {paymentMethods.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.paymentMethodCard,
                    selectedPaymentMethod === method.id && styles.paymentMethodCardSelected,
                  ]}
                  onPress={() => setSelectedPaymentMethod(method.id)}
                >
                  <Ionicons 
                    name={method.icon} 
                    size={32} 
                    color={selectedPaymentMethod === method.id ? '#0055FF' : '#666'} 
                  />
                  <Text style={[
                    styles.paymentMethodLabel,
                    selectedPaymentMethod === method.id && styles.paymentMethodLabelSelected,
                  ]}>
                    {method.label}
                  </Text>
                  {selectedPaymentMethod === method.id && (
                    <View style={styles.selectedCheck}>
                      <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {currentTicket && (
              <View style={styles.paymentSummary}>
                <Text style={styles.paymentSummaryLabel}>Total a Pagar</Text>
                <Text style={styles.paymentSummaryValue}>R$ {currentTicket.totalAmount.toFixed(2)}</Text>
              </View>
            )}

            <TouchableOpacity style={styles.confirmPaymentButton} onPress={handlePayment}>
              <Ionicons name="checkmark-circle" size={20} color="#FFF" />
              <Text style={styles.confirmPaymentButtonText}>Confirmar Pagamento</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* History Modal */}
      <Modal
        visible={showHistoryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowHistoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Histórico de Pagamentos</Text>
              <TouchableOpacity onPress={() => setShowHistoryModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              {paymentHistory.length === 0 ? (
                <View style={styles.emptyHistory}>
                  <Ionicons name="receipt-outline" size={64} color="#CCC" />
                  <Text style={styles.emptyHistoryText}>Nenhum pagamento realizado</Text>
                </View>
              ) : (
                paymentHistory.map((ticket) => (
                  <View key={ticket.id} style={styles.historyCard}>
                    <View style={styles.historyCardHeader}>
                      <View style={[styles.historyTypeIcon, { backgroundColor: getParkingTypeColor(ticket.type) + '20' }]}>
                        <Ionicons 
                          name={ticket.type === 'shopping' ? 'bag' : 
                                ticket.type === 'garage' ? 'business' : 
                                ticket.type === 'street' ? 'car' : 
                                ticket.type === 'event' ? 'musical-notes' : 'airplane'} 
                          size={20} 
                          color={getParkingTypeColor(ticket.type)} 
                        />
                      </View>
                      <View style={styles.historyCardInfo}>
                        <Text style={styles.historyCardLocation}>{ticket.locationName}</Text>
                        <Text style={styles.historyCardDate}>
                          {ticket.paymentDate && formatDate(ticket.paymentDate)}
                        </Text>
                      </View>
                      <Text style={styles.historyCardAmount}>R$ {ticket.totalAmount.toFixed(2)}</Text>
                    </View>
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
    ...headerIconButton,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  historyButton: {
    ...headerIconButton,
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
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  searchSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: '#333',
  },
  searchButton: {
    backgroundColor: '#0055FF',
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  examplesSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  examplesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  exampleChip: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  exampleChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#0055FF',
  },
  ticketCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  ticketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  ticketTypeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  ticketHeaderInfo: {
    flex: 1,
  },
  ticketLocation: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  ticketTypeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ticketTypeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  ticketDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 16,
  },
  ticketDetails: {
    marginBottom: 16,
  },
  ticketDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  ticketDetailLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    marginRight: 8,
  },
  ticketDetailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  ticketTotal: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  ticketTotalLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  ticketTotalValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0055FF',
    paddingVertical: 16,
    borderRadius: 8,
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginLeft: 8,
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
  paymentMethodsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    gap: 12,
  },
  paymentMethodCard: {
    width: (width - 64) / 2,
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    position: 'relative',
  },
  paymentMethodCardSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#0055FF',
  },
  paymentMethodLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginTop: 8,
  },
  paymentMethodLabelSelected: {
    color: '#0055FF',
  },
  selectedCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  paymentSummary: {
    backgroundColor: '#F5F5F5',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  paymentSummaryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  paymentSummaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  confirmPaymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 8,
  },
  confirmPaymentButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginLeft: 8,
  },
  emptyHistory: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyHistoryText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  historyCard: {
    backgroundColor: '#F9F9F9',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  historyCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyCardInfo: {
    flex: 1,
  },
  historyCardLocation: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  historyCardDate: {
    fontSize: 12,
    color: '#666',
  },
  historyCardAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
});
