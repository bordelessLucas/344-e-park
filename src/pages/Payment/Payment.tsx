import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  Dimensions,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, Camera } from 'expo-camera';
import { BarcodeScanningResult } from 'expo-camera';

const { width, height } = Dimensions.get('window');

interface PaymentProps {
  onBack: () => void;
}

interface Vehicle {
  id: string;
  placa: string;
  modelo: string;
  tipo: string;
}

interface TicketData {
  ticketNumber: string;
  location: string;
  street: string;
  startTime: string;
  endTime: string;
  duration: number; // em minutos
  value: number;
  status: 'valid' | 'expired' | 'invalid';
  createdAt: string;
}

export const Payment: React.FC<PaymentProps> = ({ onBack }) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [ticketData, setTicketData] = useState<TicketData | null>(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  // Mock de veículos - depois você pode pegar do banco de dados
  const vehicles: Vehicle[] = [
    { id: '1', placa: 'ABC-1234', modelo: 'Honda Civic', tipo: 'Carro' },
    { id: '2', placa: 'XYZ-5678', modelo: 'Yamaha MT-03', tipo: 'Motocicleta' },
  ];

  // Parser para extrair dados do QR code da Zona Azul
  const parseTicketQRCode = (qrData: string): TicketData | null => {
    try {
      // Tenta decodificar como JSON (formato padrão de zona azul)
      let parsedData;
      try {
        parsedData = JSON.parse(qrData);
      } catch {
        // Se não for JSON, tenta um formato alternativo (separado por pipe)
        const parts = qrData.split('|');
        if (parts.length >= 6) {
          parsedData = {
            ticketNumber: parts[0],
            location: parts[1],
            street: parts[2],
            startTime: parts[3],
            endTime: parts[4],
            value: parseFloat(parts[5]),
          };
        } else {
          return null;
        }
      }

      // Validar estrutura
      if (
        !parsedData.ticketNumber ||
        !parsedData.location ||
        !parsedData.street ||
        !parsedData.startTime ||
        !parsedData.endTime ||
        parsedData.value === undefined
      ) {
        return null;
      }

      // Calcular duração
      const start = new Date(parsedData.startTime);
      const end = new Date(parsedData.endTime);
      const duration = Math.floor((end.getTime() - start.getTime()) / (1000 * 60));

      // Validar ticket
      const now = new Date();
      const isExpired = now > end;
      const status = isExpired ? 'expired' : 'valid';

      return {
        ticketNumber: parsedData.ticketNumber,
        location: parsedData.location,
        street: parsedData.street,
        startTime: parsedData.startTime,
        endTime: parsedData.endTime,
        duration: duration > 0 ? duration : 0,
        value: parsedData.value,
        status,
        createdAt: parsedData.createdAt || new Date().toISOString(),
      };
    } catch (error) {
      console.error('Erro ao fazer parse do QR code:', error);
      return null;
    }
  };

  // Validar se é um QR code de zona azul legítimo
  const validateZonaAzulTicket = (ticket: TicketData): boolean => {
    // Validar número do ticket (deve ter pelo menos 6 dígitos)
    if (!/^\d{6,}/.test(ticket.ticketNumber)) {
      return false;
    }

    // Validar se tem local e rua
    if (!ticket.location || !ticket.street) {
      return false;
    }

    // Validar formato de data
    try {
      const start = new Date(ticket.startTime);
      const end = new Date(ticket.endTime);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return false;
      }
      if (end <= start) {
        return false;
      }
    } catch {
      return false;
    }

    // Validar valor (deve ser maior que 0)
    if (ticket.value <= 0) {
      return false;
    }

    return true;
  };

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getCameraPermissions();
  }, []);

  const handleBarCodeScanned = async ({ type, data }: BarcodeScanningResult) => {
    setScanned(true);
    setIsProcessing(true);

    // Simular delay de processamento
    await new Promise(resolve => setTimeout(resolve, 800));

    const parsedTicket = parseTicketQRCode(data);

    if (!parsedTicket) {
      setIsProcessing(false);
      Alert.alert(
        'QR Code Inválido',
        'Este não é um QR code de zona azul válido. Tente novamente.',
        [
          {
            text: 'OK',
            onPress: () => setScanned(false),
          },
        ]
      );
      return;
    }

    if (!validateZonaAzulTicket(parsedTicket)) {
      setIsProcessing(false);
      Alert.alert(
        'Ticket Inválido',
        'Os dados do ticket não são válidos. Verifique se o QR code está legível.',
        [
          {
            text: 'OK',
            onPress: () => setScanned(false),
          },
        ]
      );
      return;
    }

    setTicketData(parsedTicket);
    setShowTicketModal(true);
    setIsProcessing(false);
  };

  const handlePayment = async () => {
    if (!ticketData || !selectedVehicle) return;

    setIsProcessing(true);

    // Simular processamento de pagamento
    await new Promise(resolve => setTimeout(resolve, 2000));

    setPaymentConfirmed(true);
    setIsProcessing(false);

    // Mostrar confirmação
    Alert.alert(
      '✅ Pagamento Confirmado',
      `Pagamento de R$ ${ticketData.value.toFixed(2)} realizado com sucesso!\n\nTicket: ${ticketData.ticketNumber}\nVeículo: ${selectedVehicle.placa}`,
      [
        {
          text: 'OK',
          onPress: () => {
            setShowTicketModal(false);
            setTicketData(null);
            setPaymentConfirmed(false);
            setScanned(false);
          },
        },
      ]
    );
  };

  const formatTime = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <Text style={styles.messageText}>Solicitando permissão da câmera...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pagar Zona Azul</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.messageContainer}>
          <Ionicons name="camera-off" size={64} color="#666" />
          <Text style={styles.messageText}>Sem acesso à câmera</Text>
          <Text style={styles.messageSubText}>
            Permita o acesso à câmera nas configurações do seu dispositivo
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pagar Zona Azul</Text>
        <View style={styles.backButton} />
      </View>

      {/* Vehicle Selector */}
      <View style={styles.vehicleSelectorContainer}>
        <Text style={styles.vehicleLabel}>Veículo:</Text>
        <TouchableOpacity
          style={styles.vehicleSelector}
          onPress={() => setShowVehicleModal(true)}
        >
          {selectedVehicle ? (
            <View style={styles.selectedVehicleInfo}>
              <Text style={styles.vehiclePlaca}>{selectedVehicle.placa}</Text>
              <Text style={styles.vehicleModelo}>{selectedVehicle.modelo}</Text>
            </View>
          ) : (
            <Text style={styles.vehiclePlaceholder}>Selecione um veículo</Text>
          )}
          <Ionicons name="chevron-down" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Camera */}
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        >
          <View style={styles.cameraOverlay}>
            <View style={styles.scannerFrame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
          </View>
        </CameraView>
        
        <View style={styles.instructionsContainer}>
          {isProcessing ? (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.processingText}>Processando ticket...</Text>
            </View>
          ) : (
            <Text style={styles.instructionsText}>
              Aponte a câmera para o QR Code do ticket de zona azul
            </Text>
          )}
        </View>
      </View>

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
              <Text style={styles.modalTitle}>Selecione o veículo</Text>
              <TouchableOpacity onPress={() => setShowVehicleModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            {vehicles.map((vehicle) => (
              <TouchableOpacity
                key={vehicle.id}
                style={styles.modalItem}
                onPress={() => {
                  setSelectedVehicle(vehicle);
                  setShowVehicleModal(false);
                }}
              >
                <View style={styles.vehicleItemInfo}>
                  <View style={styles.vehicleIcon}>
                    <Ionicons 
                      name={vehicle.tipo === 'Carro' ? 'car' : 'bicycle'} 
                      size={24} 
                      color="#0055FF" 
                    />
                  </View>
                  <View style={styles.vehicleDetails}>
                    <Text style={styles.vehicleItemPlaca}>{vehicle.placa}</Text>
                    <Text style={styles.vehicleItemModelo}>
                      {vehicle.modelo} • {vehicle.tipo}
                    </Text>
                  </View>
                </View>
                {selectedVehicle?.id === vehicle.id && (
                  <Ionicons name="checkmark" size={24} color="#0055FF" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Ticket Details Modal */}
      <Modal
        visible={showTicketModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => !isProcessing && setShowTicketModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Resumo do Pagamento</Text>
              <TouchableOpacity 
                onPress={() => !isProcessing && setShowTicketModal(false)}
                disabled={isProcessing}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {ticketData && (
              <ScrollView style={styles.ticketContent}>
                {/* Ticket Header */}
                <View style={[styles.ticketSection, { backgroundColor: '#0055FF' }]}>
                  <View style={styles.ticketIconContainer}>
                    <Ionicons name="receipt" size={40} color="#fff" />
                  </View>
                  <Text style={styles.ticketNumber}>Ticket #{ticketData.ticketNumber}</Text>
                  <View
                    style={[
                      styles.ticketStatusBadge,
                      {
                        backgroundColor:
                          ticketData.status === 'valid' ? '#4CAF50' : '#FF5252',
                      },
                    ]}
                  >
                    <Text style={styles.ticketStatusText}>
                      {ticketData.status === 'valid' ? '✓ Válido' : '✗ Expirado'}
                    </Text>
                  </View>
                </View>

                {/* Vehicle Info */}
                <View style={styles.ticketSection}>
                  <Text style={styles.ticketSectionTitle}>Veículo</Text>
                  <View style={styles.ticketInfo}>
                    <Ionicons name="car" size={20} color="#0055FF" />
                    <View style={styles.ticketInfoText}>
                      <Text style={styles.ticketInfoLabel}>{selectedVehicle?.placa}</Text>
                      <Text style={styles.ticketInfoValue}>
                        {selectedVehicle?.modelo}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Location Info */}
                <View style={styles.ticketSection}>
                  <Text style={styles.ticketSectionTitle}>Local</Text>
                  <View style={styles.ticketInfo}>
                    <Ionicons name="location" size={20} color="#0055FF" />
                    <View style={styles.ticketInfoText}>
                      <Text style={styles.ticketInfoLabel}>{ticketData.street}</Text>
                      <Text style={styles.ticketInfoValue}>{ticketData.location}</Text>
                    </View>
                  </View>
                </View>

                {/* Time Info */}
                <View style={styles.ticketSection}>
                  <Text style={styles.ticketSectionTitle}>Tempo de Estacionamento</Text>
                  <View style={styles.timeContainer}>
                    <View style={styles.timeBox}>
                      <Text style={styles.timeLabel}>Início</Text>
                      <Text style={styles.timeValue}>
                        {formatTime(ticketData.startTime)}
                      </Text>
                    </View>
                    <Ionicons name="arrow-forward" size={20} color="#0055FF" />
                    <View style={styles.timeBox}>
                      <Text style={styles.timeLabel}>Término</Text>
                      <Text style={styles.timeValue}>
                        {formatTime(ticketData.endTime)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.durationBox}>
                    <Ionicons name="hourglass" size={16} color="#666" />
                    <Text style={styles.durationText}>
                      Duração: {ticketData.duration} minutos
                    </Text>
                  </View>
                </View>

                {/* Price */}
                <View style={[styles.ticketSection, styles.priceSection]}>
                  <Text style={styles.priceLabel}>Valor a Pagar</Text>
                  <Text style={styles.priceValue}>
                    R$ {ticketData.value.toFixed(2)}
                  </Text>
                </View>

                {/* Payment Button */}
                {!paymentConfirmed && (
                  <TouchableOpacity
                    style={[
                      styles.paymentButton,
                      (isProcessing || ticketData.status === 'expired') &&
                        styles.paymentButtonDisabled,
                    ]}
                    onPress={handlePayment}
                    disabled={isProcessing || ticketData.status === 'expired'}
                  >
                    {isProcessing ? (
                      <>
                        <ActivityIndicator size="small" color="#fff" />
                        <Text style={styles.paymentButtonText}>Processando...</Text>
                      </>
                    ) : (
                      <>
                        <Ionicons name="card" size={20} color="#fff" />
                        <Text style={styles.paymentButtonText}>Confirmar Pagamento</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

                {ticketData.status === 'expired' && (
                  <View style={styles.expiredWarning}>
                    <Ionicons name="warning" size={20} color="#FF5252" />
                    <Text style={styles.expiredWarningText}>
                      Este ticket expirou e não pode ser pago
                    </Text>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#000',
  },
  backButton: {
    padding: 8,
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  vehicleSelectorContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#0a0a0a',
  },
  vehicleLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  vehicleSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  selectedVehicleInfo: {
    flex: 1,
  },
  vehiclePlaca: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  vehicleModelo: {
    fontSize: 14,
    color: '#999',
  },
  vehiclePlaceholder: {
    fontSize: 16,
    color: '#666',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerFrame: {
    width: width * 0.7,
    height: width * 0.7,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#0055FF',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },
  instructionsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  instructionsText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    fontWeight: '500',
  },
  processingContainer: {
    alignItems: 'center',
  },
  processingText: {
    fontSize: 14,
    color: '#fff',
    marginTop: 12,
    fontWeight: '500',
  },
  messageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  messageText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginTop: 16,
  },
  messageSubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  vehicleItemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  vehicleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 85, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  vehicleDetails: {
    flex: 1,
  },
  vehicleItemPlaca: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  vehicleItemModelo: {
    fontSize: 14,
    color: '#999',
  },
  ticketContent: {
    flex: 1,
    maxHeight: Dimensions.get('window').height * 0.65,
  },
  ticketSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  ticketIconContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  ticketNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  ticketStatusBadge: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
  },
  ticketStatusText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  ticketSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  ticketInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ticketInfoText: {
    marginLeft: 12,
    flex: 1,
  },
  ticketInfoLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0055FF',
    marginBottom: 4,
  },
  ticketInfoValue: {
    fontSize: 13,
    color: '#666',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  timeBox: {
    flex: 1,
    backgroundColor: 'rgba(0, 85, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0055FF',
  },
  durationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 85, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
  },
  durationText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  priceSection: {
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  priceValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  paymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    marginHorizontal: 20,
    marginVertical: 16,
    paddingVertical: 16,
    borderRadius: 12,
  },
  paymentButtonDisabled: {
    opacity: 0.5,
  },
  paymentButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  expiredWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF5252',
  },
  expiredWarningText: {
    color: '#FF5252',
    fontWeight: '600',
    marginLeft: 12,
    flex: 1,
  },
});

