import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { headerIconButton } from '../../theme/touchTargets';
import {
  createPaymentMethod,
  deletePaymentMethod,
  getPaymentMethods,
  setDefaultPaymentMethod,
} from '../../services/paymentMethodService';
import {
  getPaymentPreferences,
  savePaymentPreferences,
} from '../../services/paymentPreferencesService';
import type { PaymentMethod, PaymentMethodType } from '../../types/paymentMethod';
import {
  DEFAULT_PAYMENT_PREFERENCES,
  type PaymentPreferences,
} from '../../types/paymentPreferences';

interface PaymentSettingsProps {
  onBack: () => void;
}

export const PaymentSettings: React.FC<PaymentSettingsProps> = ({ onBack }) => {
  const { user } = useAuth();

  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [savingMethod, setSavingMethod] = useState(false);

  const [type, setType] = useState<PaymentMethodType>('credit_card');
  const [nickname, setNickname] = useState('');
  const [holderName, setHolderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [pixKey, setPixKey] = useState('');

  const [preferences, setPreferences] = useState<PaymentPreferences>(DEFAULT_PAYMENT_PREFERENCES);

  const resetForm = () => {
    setType('credit_card');
    setNickname('');
    setHolderName('');
    setCardNumber('');
    setExpiresAt('');
    setPixKey('');
  };

  const loadMethods = async () => {
    if (!user?.uid) {
      setMethods([]);
      return;
    }

    setLoading(true);
    try {
      const list = await getPaymentMethods(user.uid);
      setMethods(list);
    } finally {
      setLoading(false);
    }
  };

  const loadPreferences = async () => {
    if (!user?.uid) {
      setPreferences(DEFAULT_PAYMENT_PREFERENCES);
      return;
    }

    try {
      const loadedPreferences = await getPaymentPreferences(user.uid);
      setPreferences(loadedPreferences);
    } catch (error) {
      console.error('Erro ao carregar preferências de pagamento:', error);
      setPreferences(DEFAULT_PAYMENT_PREFERENCES);
    }
  };

  const savePreferences = async (newPreferences: PaymentPreferences) => {
    setPreferences(newPreferences);

    if (!user?.uid) {
      return;
    }

    try {
      await savePaymentPreferences(user.uid, newPreferences);
    } catch (error) {
      console.error('Erro ao salvar preferências de pagamento:', error);
      Alert.alert('Erro', 'Não foi possível salvar suas preferências.');
    }
  };

  useEffect(() => {
    loadMethods().catch((error) => {
      console.error('Erro ao carregar métodos:', error);
    });
    loadPreferences().catch((error) => {
      console.error('Erro ao carregar preferências:', error);
    });
  }, [user?.uid]);

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

  const validateForm = (): string | null => {
    if (!nickname.trim()) {
      return 'Informe um apelido para a forma de pagamento.';
    }

    if (type === 'pix') {
      if (!pixKey.trim()) {
        return 'Informe uma chave PIX.';
      }
      return null;
    }

    if (cardNumber.replace(/\D/g, '').length < 13) {
      return 'Informe um número de cartão válido.';
    }

    if (!/^\d{2}\/\d{2}$/.test(expiresAt)) {
      return 'Informe a validade no formato MM/AA.';
    }

    return null;
  };

  const handleAddMethod = async () => {
    if (!user?.uid) {
      Alert.alert('Atenção', 'Você precisa estar logado para cadastrar um método.');
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      Alert.alert('Dados inválidos', validationError);
      return;
    }

    setSavingMethod(true);
    try {
      await createPaymentMethod(user.uid, {
        type,
        nickname,
        holderName,
        cardNumber: type === 'pix' ? undefined : cardNumber,
        expiresAt: type === 'pix' ? undefined : expiresAt,
        pixKey: type === 'pix' ? pixKey : undefined,
      });

      await loadMethods();
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error('Erro ao cadastrar método:', error);
      Alert.alert('Erro', 'Não foi possível cadastrar a forma de pagamento.');
    } finally {
      setSavingMethod(false);
    }
  };

  const handleSetDefault = async (methodId: string) => {
    if (!user?.uid) {
      return;
    }

    try {
      const updated = await setDefaultPaymentMethod(user.uid, methodId);
      setMethods(updated);
    } catch (error) {
      console.error('Erro ao definir padrão:', error);
      Alert.alert('Erro', 'Não foi possível definir método padrão.');
    }
  };

  const handleDelete = (method: PaymentMethod) => {
    if (!user?.uid) {
      return;
    }

    Alert.alert('Remover forma', `Deseja remover "${method.nickname}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          try {
            const updated = await deletePaymentMethod(user.uid, method.id);
            setMethods(updated);
          } catch (error) {
            console.error('Erro ao remover método:', error);
            Alert.alert('Erro', 'Não foi possível remover a forma de pagamento.');
          }
        },
      },
    ]);
  };

  const methodDescription = (method: PaymentMethod): string => {
    if (method.type === 'pix') {
      return method.pixKeyMasked || 'PIX';
    }
    return `${method.cardNumberMasked || ''} • ${method.expiresAt || ''}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={22} color="#0055FF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configurações de Pagamento</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Formas de pagamento</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddModal(true)}
            >
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.addButtonText}>Adicionar</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="small" color="#0055FF" />
          ) : methods.length === 0 ? (
            <Text style={styles.emptyText}>Nenhuma forma cadastrada.</Text>
          ) : (
            methods.map((method) => (
              <View key={method.id} style={styles.methodCard}>
                <View style={styles.methodInfo}>
                  <Text style={styles.methodTitle}>{method.nickname}</Text>
                  <Text style={styles.methodDescription}>{methodDescription(method)}</Text>
                  {method.isDefault && <Text style={styles.defaultText}>Padrão</Text>}
                </View>
                <View style={styles.methodActions}>
                  {!method.isDefault && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleSetDefault(method.id)}
                    >
                      <Text style={styles.actionText}>Padrão</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDelete(method)}
                  >
                    <Text style={[styles.actionText, styles.deleteText]}>Excluir</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Outras opções</Text>

          <View style={styles.optionRow}>
            <View style={styles.optionTextWrap}>
              <Text style={styles.optionTitle}>Selecionar forma padrão automaticamente</Text>
              <Text style={styles.optionSubtitle}>Usa o método padrão quando disponível.</Text>
            </View>
            <Switch
              value={preferences.autoSelectDefaultMethod}
              onValueChange={(value) =>
                savePreferences({ ...preferences, autoSelectDefaultMethod: value })
              }
            />
          </View>

          <View style={styles.optionRow}>
            <View style={styles.optionTextWrap}>
              <Text style={styles.optionTitle}>Exigir confirmação antes de pagar</Text>
              <Text style={styles.optionSubtitle}>Mostra confirmação antes do pagamento final.</Text>
            </View>
            <Switch
              value={preferences.requirePaymentConfirmation}
              onValueChange={(value) =>
                savePreferences({ ...preferences, requirePaymentConfirmation: value })
              }
            />
          </View>

          <View style={styles.optionRow}>
            <View style={styles.optionTextWrap}>
              <Text style={styles.optionTitle}>Notificar pagamento concluído</Text>
              <Text style={styles.optionSubtitle}>Exibe notificação após pagamento aprovado.</Text>
            </View>
            <Switch
              value={preferences.notifyAfterPayment}
              onValueChange={(value) =>
                savePreferences({ ...preferences, notifyAfterPayment: value })
              }
            />
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => !savingMethod && setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nova forma de pagamento</Text>
              <TouchableOpacity
                onPress={() => !savingMethod && setShowAddModal(false)}
                disabled={savingMethod}
              >
                <Ionicons name="close" size={22} color="#222" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Tipo</Text>
            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[styles.typeButton, type === 'credit_card' && styles.typeButtonActive]}
                onPress={() => setType('credit_card')}
              >
                <Text style={styles.typeButtonText}>Crédito</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, type === 'debit_card' && styles.typeButtonActive]}
                onPress={() => setType('debit_card')}
              >
                <Text style={styles.typeButtonText}>Débito</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, type === 'pix' && styles.typeButtonActive]}
                onPress={() => setType('pix')}
              >
                <Text style={styles.typeButtonText}>PIX</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Apelido</Text>
            <TextInput
              style={styles.input}
              value={nickname}
              onChangeText={setNickname}
              placeholder="Ex: Cartão principal"
            />

            {type === 'pix' ? (
              <>
                <Text style={styles.label}>Chave PIX</Text>
                <TextInput
                  style={styles.input}
                  value={pixKey}
                  onChangeText={setPixKey}
                  placeholder="CPF, email, telefone..."
                  autoCapitalize="none"
                />
              </>
            ) : (
              <>
                <Text style={styles.label}>Nome no cartão</Text>
                <TextInput
                  style={styles.input}
                  value={holderName}
                  onChangeText={setHolderName}
                  placeholder="Nome completo"
                />

                <Text style={styles.label}>Número do cartão</Text>
                <TextInput
                  style={styles.input}
                  value={cardNumber}
                  onChangeText={(text) => setCardNumber(formatCardInput(text))}
                  placeholder="0000 0000 0000 0000"
                  keyboardType="number-pad"
                />

                <Text style={styles.label}>Validade</Text>
                <TextInput
                  style={styles.input}
                  value={expiresAt}
                  onChangeText={(text) => setExpiresAt(formatExpiryInput(text))}
                  placeholder="MM/AA"
                  keyboardType="number-pad"
                />
              </>
            )}

            <TouchableOpacity
              style={[styles.saveButton, savingMethod && styles.saveButtonDisabled]}
              onPress={handleAddMethod}
              disabled={savingMethod}
            >
              {savingMethod ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Salvar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F8FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 52,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#F2F8FF',
  },
  backButton: {
    ...headerIconButton,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0055FF',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#DCE6F8',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#17315E',
  },
  addButton: {
    backgroundColor: '#0055FF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  emptyText: {
    color: '#667',
  },
  methodCard: {
    borderWidth: 1,
    borderColor: '#E2EBFA',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  methodInfo: {
    marginBottom: 8,
  },
  methodTitle: {
    fontSize: 15,
    color: '#1E3A63',
    fontWeight: '700',
  },
  methodDescription: {
    color: '#5B6D8F',
    marginTop: 4,
  },
  defaultText: {
    marginTop: 5,
    color: '#2E9B2E',
    fontWeight: '700',
    fontSize: 12,
  },
  methodActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    borderWidth: 1,
    borderColor: '#C9D8F2',
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  actionText: {
    color: '#2C4D82',
    fontWeight: '600',
    fontSize: 12,
  },
  deleteButton: {
    borderColor: '#E7B7B7',
  },
  deleteText: {
    color: '#AF3D3D',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E9EEF8',
    paddingVertical: 10,
  },
  optionTextWrap: {
    flex: 1,
    paddingRight: 10,
  },
  optionTitle: {
    color: '#1D355D',
    fontWeight: '600',
    marginBottom: 3,
  },
  optionSubtitle: {
    color: '#6D7D99',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A3159',
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  typeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D8E3F5',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  typeButtonActive: {
    borderColor: '#0055FF',
    backgroundColor: '#E7F0FF',
  },
  typeButtonText: {
    color: '#214173',
    fontWeight: '600',
    fontSize: 12,
  },
  label: {
    marginTop: 8,
    marginBottom: 5,
    color: '#4D6085',
    fontSize: 12,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D6E1F4',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  saveButton: {
    marginTop: 14,
    backgroundColor: '#0055FF',
    alignItems: 'center',
    borderRadius: 10,
    paddingVertical: 12,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});
