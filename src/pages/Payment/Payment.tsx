import React, { useEffect, useMemo, useState } from 'react';
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
  TextInput,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, Camera, BarcodeScanningResult } from 'expo-camera';
import { useAuth } from '../../hooks/useAuth';
import { useVehicles } from '../../contexts/VehiclesContext';
import { addParkingHistoryEntry } from '../../services/parkingHistoryService';
import { headerIconButton } from '../../theme/touchTargets';
import {
  createPaymentMethod,
  deletePaymentMethod,
  getPaymentMethods,
  setDefaultPaymentMethod,
} from '../../services/paymentMethodService';
import { getPaymentPreferences } from '../../services/paymentPreferencesService';
import type { PaymentMethod, PaymentMethodType } from '../../types/paymentMethod';
import {
  DEFAULT_PAYMENT_PREFERENCES,
  type PaymentPreferences,
} from '../../types/paymentPreferences';

const { width } = Dimensions.get('window');

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
  duration: number;
  value: number;
  status: 'valid' | 'expired' | 'invalid';
  createdAt: string;
}

export const Payment: React.FC<PaymentProps> = ({ onBack }) => {
  const { user } = useAuth();
  const { vehicles: vehicleList } = useVehicles();

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  const [ticketData, setTicketData] = useState<TicketData | null>(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);
  const [paymentPreferences, setPaymentPreferences] = useState<PaymentPreferences>(
    DEFAULT_PAYMENT_PREFERENCES
  );
  const [showPaymentMethodsModal, setShowPaymentMethodsModal] = useState(false);
  const [showAddPaymentMethodModal, setShowAddPaymentMethodModal] = useState(false);
  const [isSavingPaymentMethod, setIsSavingPaymentMethod] = useState(false);

  const [newMethodType, setNewMethodType] = useState<PaymentMethodType>('credit_card');
  const [newMethodNickname, setNewMethodNickname] = useState('');
  const [newMethodHolderName, setNewMethodHolderName] = useState('');
  const [newMethodCardNumber, setNewMethodCardNumber] = useState('');
  const [newMethodExpiresAt, setNewMethodExpiresAt] = useState('');
  const [newMethodPixKey, setNewMethodPixKey] = useState('');

  const vehicles: Vehicle[] = useMemo(
    () =>
      vehicleList.map((v, idx) => ({
        id: `${v.placa}_${idx}`,
        placa: v.placa,
        modelo: v.modelo,
        tipo: v.tipo,
      })),
    [vehicleList]
  );

  const loadPaymentMethods = async (preferredMethodId?: string) => {
    if (!user?.uid) {
      setPaymentMethods([]);
      setSelectedPaymentMethod(null);
      return;
    }

    setLoadingPaymentMethods(true);
    try {
      const methods = await getPaymentMethods(user.uid);
      setPaymentMethods(methods);

      if (methods.length === 0) {
        setSelectedPaymentMethod(null);
        return;
      }

      const selected = preferredMethodId
        ? methods.find((item) => item.id === preferredMethodId) || null
        : null;
      if (selected) {
        setSelectedPaymentMethod(selected);
        return;
      }

      if (paymentPreferences.autoSelectDefaultMethod) {
        setSelectedPaymentMethod(methods.find((item) => item.isDefault) || methods[0]);
        return;
      }

      setSelectedPaymentMethod(null);
    } finally {
      setLoadingPaymentMethods(false);
    }
  };

  const loadPaymentPreferences = async () => {
    if (!user?.uid) {
      setPaymentPreferences(DEFAULT_PAYMENT_PREFERENCES);
      return;
    }

    try {
      const loadedPreferences = await getPaymentPreferences(user.uid);
      setPaymentPreferences(loadedPreferences);
    } catch (error) {
      console.error('Erro ao carregar preferências de pagamento:', error);
      setPaymentPreferences(DEFAULT_PAYMENT_PREFERENCES);
    }
  };

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getCameraPermissions();
  }, []);

  useEffect(() => {
    loadPaymentPreferences().catch((error) => {
      console.error('Erro ao carregar preferências de pagamento:', error);
    });
  }, [user?.uid]);

  useEffect(() => {
    loadPaymentMethods().catch((error) => {
      console.error('Erro ao carregar métodos de pagamento:', error);
    });
  }, [user?.uid, paymentPreferences.autoSelectDefaultMethod]);

  const parseTicketQRCode = (qrData: string): TicketData | null => {
    try {
      let parsedData;
      try {
        parsedData = JSON.parse(qrData);
      } catch {
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

      const start = new Date(parsedData.startTime);
      const end = new Date(parsedData.endTime);
      const duration = Math.floor((end.getTime() - start.getTime()) / (1000 * 60));

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

  const validateZonaAzulTicket = (ticket: TicketData): boolean => {
    if (!/^\d{6,}/.test(ticket.ticketNumber)) {
      return false;
    }

    if (!ticket.location || !ticket.street) {
      return false;
    }

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

    if (ticket.value <= 0) {
      return false;
    }

    return true;
  };

  const resetNewMethodForm = () => {
    setNewMethodType('credit_card');
    setNewMethodNickname('');
    setNewMethodHolderName('');
    setNewMethodCardNumber('');
    setNewMethodExpiresAt('');
    setNewMethodPixKey('');
  };

  const formatCardInput = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    const groups = digits.match(/.{1,4}/g) || [];
    return groups.join(' ');
  };

  const formatExpiryInput = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length < 3) {
      return digits;
    }
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  };

  const validateNewPaymentMethod = (): string | null => {
    if (!newMethodNickname.trim()) {
      return 'Informe um apelido para a forma de pagamento.';
    }

    if (newMethodType === 'pix') {
      if (!newMethodPixKey.trim()) {
        return 'Informe uma chave PIX válida.';
      }
      return null;
    }

    const cardDigits = newMethodCardNumber.replace(/\D/g, '');
    if (cardDigits.length < 13) {
      return 'Informe um número de cartão válido.';
    }

    if (!newMethodExpiresAt || !/^\d{2}\/\d{2}$/.test(newMethodExpiresAt)) {
      return 'Informe a validade no formato MM/AA.';
    }

    return null;
  };

  const handleSavePaymentMethod = async () => {
    if (!user?.uid) {
      Alert.alert('Atenção', 'Você precisa estar logado para cadastrar uma forma de pagamento.');
      return;
    }

    const validationError = validateNewPaymentMethod();
    if (validationError) {
      Alert.alert('Dados inválidos', validationError);
      return;
    }

    setIsSavingPaymentMethod(true);
    try {
      const created = await createPaymentMethod(user.uid, {
        type: newMethodType,
        nickname: newMethodNickname,
        holderName: newMethodHolderName,
        cardNumber: newMethodType === 'pix' ? undefined : newMethodCardNumber,
        expiresAt: newMethodType === 'pix' ? undefined : newMethodExpiresAt,
        pixKey: newMethodType === 'pix' ? newMethodPixKey : undefined,
      });

      await loadPaymentMethods(created.id);
      setShowAddPaymentMethodModal(false);
      resetNewMethodForm();

      Alert.alert('Sucesso', 'Forma de pagamento cadastrada com sucesso.');
    } catch (error) {
      console.error('Erro ao cadastrar forma de pagamento:', error);
      Alert.alert('Erro', 'Não foi possível cadastrar a forma de pagamento. Tente novamente.');
    } finally {
      setIsSavingPaymentMethod(false);
    }
  };

  const handleDeletePaymentMethod = (method: PaymentMethod) => {
    if (!user?.uid) {
      return;
    }

    Alert.alert(
      'Remover forma de pagamento',
      `Deseja remover "${method.nickname}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              const updated = await deletePaymentMethod(user.uid, method.id);
              setPaymentMethods(updated);

              if (updated.length === 0) {
                setSelectedPaymentMethod(null);
              } else if (selectedPaymentMethod?.id === method.id) {
                setSelectedPaymentMethod(updated.find((item) => item.isDefault) || updated[0]);
              }
            } catch (error) {
              console.error('Erro ao remover forma de pagamento:', error);
              Alert.alert('Erro', 'Não foi possível remover a forma de pagamento.');
            }
          },
        },
      ]
    );
  };

  const handleSetDefaultMethod = async (methodId: string) => {
    if (!user?.uid) {
      return;
    }

    try {
      const updated = await setDefaultPaymentMethod(user.uid, methodId);
      setPaymentMethods(updated);
      setSelectedPaymentMethod(updated.find((item) => item.id === methodId) || null);
    } catch (error) {
      console.error('Erro ao definir método padrão:', error);
      Alert.alert('Erro', 'Não foi possível definir este método como padrão.');
    }
  };

  const handleBarCodeScanned = async ({ data }: BarcodeScanningResult) => {
    setScanned(true);
    setIsProcessing(true);

    await new Promise((resolve) => setTimeout(resolve, 800));

    const parsedTicket = parseTicketQRCode(data);

    if (!parsedTicket) {
      setIsProcessing(false);
      Alert.alert('QR Code Inválido', 'Este não é um QR code de zona azul válido. Tente novamente.', [
        {
          text: 'OK',
          onPress: () => setScanned(false),
        },
      ]);
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

  const finishPaymentFlow = () => {
    setShowTicketModal(false);
    setTicketData(null);
    setPaymentConfirmed(false);
    setScanned(false);
  };

  const processPayment = async () => {
    if (!ticketData || !selectedVehicle || !selectedPaymentMethod) {
      return;
    }

    setIsProcessing(true);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    setPaymentConfirmed(true);
    setIsProcessing(false);

    if (user?.uid && ticketData && selectedVehicle && selectedPaymentMethod) {
      try {
        await addParkingHistoryEntry(user.uid, {
          createdAt: new Date().toISOString(),
          ticketNumber: ticketData.ticketNumber,
          location: ticketData.location,
          street: ticketData.street,
          value: ticketData.value,
          vehiclePlate: selectedVehicle.placa,
          vehicleModel: selectedVehicle.modelo,
          paymentMethodLabel: `${selectedPaymentMethod.nickname} (${getMethodTypeLabel(selectedPaymentMethod.type)})`,
        });
      } catch {
        /* histórico é opcional */
      }
    }

    if (!paymentPreferences.notifyAfterPayment) {
      finishPaymentFlow();
      return;
    }

    Alert.alert(
      'Pagamento Confirmado',
      `Pagamento de R$ ${ticketData.value.toFixed(2)} realizado com sucesso.\n\nTicket: ${ticketData.ticketNumber}\nVeículo: ${selectedVehicle.placa}\nForma: ${selectedPaymentMethod.nickname}`,
      [
        {
          text: 'OK',
          onPress: finishPaymentFlow,
        },
      ]
    );
  };

  const handlePayment = async () => {
    if (!ticketData || !selectedVehicle || !selectedPaymentMethod) {
      return;
    }

    if (!paymentPreferences.requirePaymentConfirmation) {
      await processPayment();
      return;
    }

    Alert.alert(
      'Confirmar pagamento',
      `Deseja pagar R$ ${ticketData.value.toFixed(2)} com ${selectedPaymentMethod.nickname} para o veículo ${selectedVehicle.placa}?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Confirmar',
          onPress: () => {
            processPayment().catch((error) => {
              console.error('Erro ao processar pagamento:', error);
              Alert.alert('Erro', 'Não foi possível concluir o pagamento.');
            });
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

  const paymentMethodSubtitle = useMemo(() => {
    if (!selectedPaymentMethod) {
      return 'Cadastre ou selecione uma forma de pagamento';
    }

    if (selectedPaymentMethod.type === 'pix') {
      return selectedPaymentMethod.pixKeyMasked || 'PIX';
    }

    return `${selectedPaymentMethod.cardNumberMasked || ''} • ${selectedPaymentMethod.expiresAt || ''}`;
  }, [selectedPaymentMethod]);

  const getMethodTypeLabel = (type: PaymentMethodType): string => {
    if (type === 'credit_card') {
      return 'Cartão de Crédito';
    }
    if (type === 'debit_card') {
      return 'Cartão de Débito';
    }
    return 'PIX';
  };

  const getMethodIcon = (type: PaymentMethodType): keyof typeof Ionicons.glyphMap => {
    if (type === 'pix') {
      return 'qr-code-outline';
    }
    if (type === 'debit_card') {
      return 'card-outline';
    }
    return 'card';
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
          <Ionicons name="camera-outline" size={64} color="#666" />
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

      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pagar Zona Azul</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.vehicleSelectorContainer}>
        <Text style={styles.vehicleLabel}>Veículo</Text>
        <TouchableOpacity style={styles.vehicleSelector} onPress={() => setShowVehicleModal(true)}>
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

      <View style={styles.paymentSelectorContainer}>
        <Text style={styles.vehicleLabel}>Forma de pagamento</Text>
        <TouchableOpacity
          style={styles.paymentSelector}
          onPress={() => setShowPaymentMethodsModal(true)}
          disabled={loadingPaymentMethods}
        >
          <View style={styles.paymentSelectorInfo}>
            <Text style={styles.paymentTitle}>
              {selectedPaymentMethod?.nickname || 'Selecionar forma de pagamento'}
            </Text>
            <Text style={styles.paymentSubtitle}>{paymentMethodSubtitle}</Text>
          </View>
          {loadingPaymentMethods ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="chevron-down" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

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

      <Modal
        visible={showVehicleModal}
        transparent
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

      <Modal
        visible={showPaymentMethodsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPaymentMethodsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Formas de pagamento</Text>
              <TouchableOpacity onPress={() => setShowPaymentMethodsModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.paymentMethodsList}>
              {paymentMethods.length === 0 && (
                <View style={styles.emptyMethodsContainer}>
                  <Ionicons name="wallet-outline" size={36} color="#666" />
                  <Text style={styles.emptyMethodsTitle}>Nenhuma forma cadastrada</Text>
                  <Text style={styles.emptyMethodsText}>
                    Cadastre um cartão ou PIX para pagar a zona azul com mais rapidez.
                  </Text>
                </View>
              )}

              {paymentMethods.map((method) => {
                const isSelected = selectedPaymentMethod?.id === method.id;
                return (
                  <TouchableOpacity
                    key={method.id}
                    style={[styles.paymentMethodItem, isSelected && styles.paymentMethodItemSelected]}
                    onPress={() => {
                      setSelectedPaymentMethod(method);
                      setShowPaymentMethodsModal(false);
                    }}
                  >
                    <View style={styles.paymentMethodMainInfo}>
                      <View style={styles.paymentMethodIcon}>
                        <Ionicons name={getMethodIcon(method.type)} size={20} color="#0055FF" />
                      </View>
                      <View style={styles.paymentMethodTexts}>
                        <Text style={styles.paymentMethodTitle}>{method.nickname}</Text>
                        <Text style={styles.paymentMethodLine}>{getMethodTypeLabel(method.type)}</Text>
                        <Text style={styles.paymentMethodLine}>
                          {method.type === 'pix'
                            ? method.pixKeyMasked || 'PIX'
                            : `${method.cardNumberMasked || ''} • ${method.expiresAt || ''}`}
                        </Text>
                        {method.isDefault && (
                          <Text style={styles.defaultBadge}>Padrão</Text>
                        )}
                      </View>
                    </View>

                    <View style={styles.paymentMethodActions}>
                      {!method.isDefault && (
                        <TouchableOpacity
                          style={styles.methodActionButton}
                          onPress={() => handleSetDefaultMethod(method.id)}
                        >
                          <Text style={styles.methodActionText}>Tornar padrão</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={[styles.methodActionButton, styles.methodActionDelete]}
                        onPress={() => handleDeletePaymentMethod(method)}
                      >
                        <Text style={[styles.methodActionText, styles.methodActionDeleteText]}>Remover</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={styles.addMethodButton}
              onPress={() => {
                setShowPaymentMethodsModal(false);
                setShowAddPaymentMethodModal(true);
              }}
            >
              <Ionicons name="add-circle-outline" size={20} color="#fff" />
              <Text style={styles.addMethodButtonText}>Cadastrar nova forma</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showAddPaymentMethodModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!isSavingPaymentMethod) {
            setShowAddPaymentMethodModal(false);
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nova forma de pagamento</Text>
              <TouchableOpacity
                onPress={() => {
                  if (!isSavingPaymentMethod) {
                    setShowAddPaymentMethodModal(false);
                  }
                }}
                disabled={isSavingPaymentMethod}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContent}>
              <Text style={styles.formLabel}>Tipo</Text>
              <View style={styles.typeSelectorRow}>
                <TouchableOpacity
                  style={[
                    styles.typeOption,
                    newMethodType === 'credit_card' && styles.typeOptionActive,
                  ]}
                  onPress={() => setNewMethodType('credit_card')}
                >
                  <Text style={styles.typeOptionText}>Crédito</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeOption,
                    newMethodType === 'debit_card' && styles.typeOptionActive,
                  ]}
                  onPress={() => setNewMethodType('debit_card')}
                >
                  <Text style={styles.typeOptionText}>Débito</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeOption, newMethodType === 'pix' && styles.typeOptionActive]}
                  onPress={() => setNewMethodType('pix')}
                >
                  <Text style={styles.typeOptionText}>PIX</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.formLabel}>Apelido</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Ex: Cartão principal"
                placeholderTextColor="#666"
                value={newMethodNickname}
                onChangeText={setNewMethodNickname}
              />

              {newMethodType === 'pix' ? (
                <>
                  <Text style={styles.formLabel}>Chave PIX</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="CPF, e-mail, telefone ou chave aleatória"
                    placeholderTextColor="#666"
                    value={newMethodPixKey}
                    onChangeText={setNewMethodPixKey}
                    autoCapitalize="none"
                  />
                </>
              ) : (
                <>
                  <Text style={styles.formLabel}>Nome impresso no cartão</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Nome completo"
                    placeholderTextColor="#666"
                    value={newMethodHolderName}
                    onChangeText={setNewMethodHolderName}
                    autoCapitalize="words"
                  />

                  <Text style={styles.formLabel}>Número do cartão</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="0000 0000 0000 0000"
                    placeholderTextColor="#666"
                    keyboardType="number-pad"
                    value={newMethodCardNumber}
                    onChangeText={(text) => setNewMethodCardNumber(formatCardInput(text))}
                  />

                  <Text style={styles.formLabel}>Validade</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="MM/AA"
                    placeholderTextColor="#666"
                    keyboardType="number-pad"
                    value={newMethodExpiresAt}
                    onChangeText={(text) => setNewMethodExpiresAt(formatExpiryInput(text))}
                  />
                </>
              )}
            </ScrollView>

            <TouchableOpacity
              style={[styles.addMethodButton, isSavingPaymentMethod && styles.paymentButtonDisabled]}
              onPress={handleSavePaymentMethod}
              disabled={isSavingPaymentMethod}
            >
              {isSavingPaymentMethod ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="save-outline" size={20} color="#fff" />
              )}
              <Text style={styles.addMethodButtonText}>
                {isSavingPaymentMethod ? 'Salvando...' : 'Salvar forma de pagamento'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showTicketModal}
        transparent
        animationType="slide"
        onRequestClose={() => !isProcessing && setShowTicketModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Resumo do pagamento</Text>
              <TouchableOpacity
                onPress={() => !isProcessing && setShowTicketModal(false)}
                disabled={isProcessing}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {ticketData && (
              <ScrollView style={styles.ticketContent}>
                <View style={[styles.ticketSection, { backgroundColor: '#0055FF' }]}>
                  <View style={styles.ticketIconContainer}>
                    <Ionicons name="receipt" size={40} color="#fff" />
                  </View>
                  <Text style={styles.ticketNumber}>Ticket #{ticketData.ticketNumber}</Text>
                  <View
                    style={[
                      styles.ticketStatusBadge,
                      {
                        backgroundColor: ticketData.status === 'valid' ? '#4CAF50' : '#FF5252',
                      },
                    ]}
                  >
                    <Text style={styles.ticketStatusText}>
                      {ticketData.status === 'valid' ? 'Valido' : 'Expirado'}
                    </Text>
                  </View>
                </View>

                <View style={styles.ticketSection}>
                  <Text style={styles.ticketSectionTitle}>Veículo</Text>
                  <View style={styles.ticketInfo}>
                    <Ionicons name="car" size={20} color="#0055FF" />
                    <View style={styles.ticketInfoText}>
                      <Text style={styles.ticketInfoLabel}>{selectedVehicle?.placa}</Text>
                      <Text style={styles.ticketInfoValue}>{selectedVehicle?.modelo}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.ticketSection}>
                  <Text style={styles.ticketSectionTitle}>Forma de pagamento</Text>
                  <TouchableOpacity
                    style={styles.ticketPaymentMethodRow}
                    onPress={() => setShowPaymentMethodsModal(true)}
                  >
                    <Ionicons
                      name={selectedPaymentMethod ? getMethodIcon(selectedPaymentMethod.type) : 'wallet-outline'}
                      size={20}
                      color="#0055FF"
                    />
                    <View style={styles.ticketInfoText}>
                      <Text style={styles.ticketInfoLabel}>
                        {selectedPaymentMethod?.nickname || 'Selecionar forma de pagamento'}
                      </Text>
                      <Text style={styles.ticketInfoValue}>{paymentMethodSubtitle}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#888" />
                  </TouchableOpacity>
                </View>

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

                <View style={styles.ticketSection}>
                  <Text style={styles.ticketSectionTitle}>Tempo de estacionamento</Text>
                  <View style={styles.timeContainer}>
                    <View style={styles.timeBox}>
                      <Text style={styles.timeLabel}>Início</Text>
                      <Text style={styles.timeValue}>{formatTime(ticketData.startTime)}</Text>
                    </View>
                    <Ionicons name="arrow-forward" size={20} color="#0055FF" />
                    <View style={styles.timeBox}>
                      <Text style={styles.timeLabel}>Término</Text>
                      <Text style={styles.timeValue}>{formatTime(ticketData.endTime)}</Text>
                    </View>
                  </View>
                  <View style={styles.durationBox}>
                    <Ionicons name="hourglass" size={16} color="#666" />
                    <Text style={styles.durationText}>Duração: {ticketData.duration} minutos</Text>
                  </View>
                </View>

                <View style={[styles.ticketSection, styles.priceSection]}>
                  <Text style={styles.priceLabel}>Valor a pagar</Text>
                  <Text style={styles.priceValue}>R$ {ticketData.value.toFixed(2)}</Text>
                </View>

                {!paymentConfirmed && (
                  <TouchableOpacity
                    style={[
                      styles.paymentButton,
                      (
                        isProcessing ||
                        ticketData.status === 'expired' ||
                        !selectedPaymentMethod ||
                        !selectedVehicle
                      ) &&
                        styles.paymentButtonDisabled,
                    ]}
                    onPress={handlePayment}
                    disabled={
                      isProcessing ||
                      ticketData.status === 'expired' ||
                      !selectedPaymentMethod ||
                      !selectedVehicle
                    }
                  >
                    {isProcessing ? (
                      <>
                        <ActivityIndicator size="small" color="#fff" />
                        <Text style={styles.paymentButtonText}>Processando...</Text>
                      </>
                    ) : (
                      <>
                        <Ionicons name="card" size={20} color="#fff" />
                        <Text style={styles.paymentButtonText}>
                          {selectedVehicle && selectedPaymentMethod
                            ? paymentPreferences.requirePaymentConfirmation
                              ? 'Confirmar pagamento'
                              : 'Pagar agora'
                            : 'Selecione veículo e forma de pagamento'}
                        </Text>
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
    ...headerIconButton,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  vehicleSelectorContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#0a0a0a',
  },
  paymentSelectorContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
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
    padding: 14,
    borderWidth: 1,
    borderColor: '#333',
  },
  paymentSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#333',
    minHeight: 72,
  },
  paymentSelectorInfo: {
    flex: 1,
    paddingRight: 8,
  },
  paymentTitle: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '700',
    marginBottom: 4,
  },
  paymentSubtitle: {
    fontSize: 13,
    color: '#999',
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
    maxHeight: '80%',
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
  paymentMethodsList: {
    maxHeight: 360,
  },
  emptyMethodsContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 28,
  },
  emptyMethodsTitle: {
    marginTop: 12,
    fontSize: 16,
    color: '#fff',
    fontWeight: '700',
  },
  emptyMethodsText: {
    marginTop: 8,
    color: '#999',
    textAlign: 'center',
  },
  paymentMethodItem: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  paymentMethodItemSelected: {
    backgroundColor: 'rgba(0, 85, 255, 0.12)',
  },
  paymentMethodMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentMethodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 85, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  paymentMethodTexts: {
    flex: 1,
  },
  paymentMethodTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  paymentMethodLine: {
    color: '#aaa',
    fontSize: 13,
    marginBottom: 2,
  },
  defaultBadge: {
    color: '#6BCB77',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  paymentMethodActions: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 10,
  },
  methodActionButton: {
    borderWidth: 1,
    borderColor: '#556',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  methodActionText: {
    color: '#d0d0d0',
    fontSize: 12,
    fontWeight: '600',
  },
  methodActionDelete: {
    borderColor: '#954444',
  },
  methodActionDeleteText: {
    color: '#FF8C8C',
  },
  addMethodButton: {
    marginHorizontal: 20,
    marginTop: 14,
    marginBottom: 20,
    backgroundColor: '#0055FF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  addMethodButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  formContent: {
    paddingHorizontal: 20,
    maxHeight: 420,
  },
  formLabel: {
    color: '#8f8f8f',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 14,
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#101010',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 10,
    color: '#fff',
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
  },
  typeOptionActive: {
    borderColor: '#0055FF',
    backgroundColor: 'rgba(0, 85, 255, 0.2)',
  },
  typeOptionText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
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
  ticketPaymentMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 85, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(0, 85, 255, 0.2)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
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
    gap: 8,
  },
  paymentButtonDisabled: {
    opacity: 0.5,
  },
  paymentButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
