import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Switch,
  Modal,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { compactIconButton, headerIconButton } from '../../theme/touchTargets';

interface AddVehicleProps {
  onCancel: () => void;
  onAdd?: (vehicle: VehicleData) => void;
  initialVehicle?: VehicleData | null;
  title?: string;
  submitLabel?: string;
}

export interface VehicleData {
  placa: string;
  tipo: string;
  modelo: string;
  ano: string;
  possuiSeguro: boolean;
  insurance?: {
    company: string;
    policyNumber: string;
    validUntil: string;
  };
}

const tipos = ['Carro', 'Motocicleta', 'Caminhão/Ônibus'];

export const AddVehicle: React.FC<AddVehicleProps> = ({
  onCancel,
  onAdd,
  initialVehicle = null,
  title = 'Adicionar veículo',
  submitLabel = 'Adicionar',
}) => {
  const insets = useSafeAreaInsets();
  const [placaLetras, setPlacaLetras] = useState('');
  const [placaNumeros, setPlacaNumeros] = useState('');
  const [tipo, setTipo] = useState('');
  const [modelo, setModelo] = useState('');
  const [ano, setAno] = useState('');
  const [possuiSeguro, setPossuiSeguro] = useState(false);
  const [insuranceCompany, setInsuranceCompany] = useState('');
  const [insurancePolicy, setInsurancePolicy] = useState('');
  const [insuranceValidUntil, setInsuranceValidUntil] = useState('');

  const [showTipoModal, setShowTipoModal] = useState(false);
  const [showAnoModal, setShowAnoModal] = useState(false);
  const [showPlacaInfo, setShowPlacaInfo] = useState(false);

  const currentYear = new Date().getFullYear();
  const anos = useMemo(
    () => Array.from({ length: 45 }, (_, i) => (currentYear - i).toString()),
    [currentYear],
  );

  const placaCompleta = `${placaLetras}-${placaNumeros}`;
  const placaPatternRegex = /^(?:[0-9][A-Z][0-9]{2}|[0-9]{4})$/;
  const isFormValid =
    placaLetras.trim().length === 3 &&
    placaPatternRegex.test(placaNumeros) &&
    tipo !== '' &&
    modelo.trim() !== '' &&
    ano !== '';

  const formatInsuranceCompanyInput = (value: string) => {
    const cleaned = value
      .replace(/[^A-Za-zÀ-ÖØ-öø-ÿ\s]/g, '')
      .replace(/\s+/g, ' ')
      .trimStart();
    return cleaned.slice(0, 60);
  };

  const formatInsurancePolicyInput = (value: string) => {
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16);
    const groups = cleaned.match(/.{1,4}/g) || [];
    return groups.join('-');
  };

  const formatInsuranceValidUntilInput = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 4) {
      return digits;
    }
    if (digits.length <= 6) {
      return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    }
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
  };

  useEffect(() => {
    if (!initialVehicle) {
      setPlacaLetras('');
      setPlacaNumeros('');
      setTipo('');
      setModelo('');
      setAno('');
      setPossuiSeguro(false);
      setInsuranceCompany('');
      setInsurancePolicy('');
      setInsuranceValidUntil('');
      return;
    }

    const [letters = '', numbers = ''] = initialVehicle.placa.split('-');
    setPlacaLetras(letters);
    setPlacaNumeros(numbers);
    setTipo(initialVehicle.tipo);
    setModelo(initialVehicle.modelo);
    setAno(initialVehicle.ano);
    setPossuiSeguro(initialVehicle.possuiSeguro);
    setInsuranceCompany(initialVehicle.insurance?.company || '');
    setInsurancePolicy(initialVehicle.insurance?.policyNumber || '');
    setInsuranceValidUntil(initialVehicle.insurance?.validUntil || '');
  }, [initialVehicle]);

  const handleAdd = () => {
    if (!isFormValid) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    const vehicleData: VehicleData = {
      placa: placaCompleta.toUpperCase(),
      tipo,
      modelo: modelo.trim(),
      ano,
      possuiSeguro,
    };

    if (possuiSeguro) {
      vehicleData.insurance = {
        company: insuranceCompany.trim(),
        policyNumber: insurancePolicy.trim(),
        validUntil: insuranceValidUntil.trim(),
      };
    }

    if (onAdd) {
      onAdd(vehicleData);
    } else {
      Alert.alert('Sucesso', 'Veículo adicionado com sucesso!');
      onCancel();
    }
  };

  const headerPaddingTop = Math.max(12, insets.top + 8);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />

      <View style={[styles.header, { paddingTop: headerPaddingTop }]}>
        <TouchableOpacity onPress={onCancel} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0055FF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <TouchableOpacity
          style={styles.helpButton}
          accessibilityLabel="Ajuda sobre a placa"
          onPress={() => setShowPlacaInfo(true)}
        >
          <Ionicons name="help-circle-outline" size={24} color="#0055FF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(32, insets.bottom + 24) }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formCard}>
          <Text style={styles.formSubtitle}>Preencha os dados do veículo</Text>

          <View style={styles.inputContainer}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Placa</Text>
              <TouchableOpacity style={styles.infoButton} onPress={() => setShowPlacaInfo(true)}>
                <Ionicons name="information-circle" size={18} color="#0055FF" />
              </TouchableOpacity>
            </View>
            <View style={styles.placaRow}>
              <TextInput
                style={[styles.placaBox, styles.placaBoxLeft]}
                placeholder="ABC"
                placeholderTextColor="#999"
                value={placaLetras}
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 3);
                  setPlacaLetras(cleaned);
                }}
                maxLength={3}
                autoCapitalize="characters"
              />
              <Text style={styles.placaDash}>-</Text>
              <TextInput
                style={[styles.placaBox, styles.placaBoxRight]}
                placeholder="1A23 ou 1234"
                placeholderTextColor="#999"
                value={placaNumeros}
                onChangeText={(text) => {
                  const upper = text.toUpperCase();
                  const cleaned = upper.replace(/[^A-Z0-9]/g, '').slice(0, 4);
                  setPlacaNumeros(cleaned);
                }}
                maxLength={4}
                autoCapitalize="characters"
              />
            </View>
            <Text style={styles.helperText}>
              Formato: LLL-NLNN (L = letra, N = número). Ex.: ABC-1A23. Placas antigas com 4 números:
              ABC-1234
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Tipo</Text>
            <TouchableOpacity style={styles.selectInput} onPress={() => setShowTipoModal(true)}>
              <Text style={[styles.selectText, !tipo && styles.placeholderText]}>
                {tipo || 'Selecione o tipo'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.rowContainer}>
            <View style={[styles.inputContainer, styles.modeloContainer]}>
              <Text style={styles.label}>Modelo</Text>
              <TextInput
                style={styles.input}
                placeholder="Digite o modelo"
                placeholderTextColor="#999"
                value={modelo}
                onChangeText={setModelo}
                autoCapitalize="words"
              />
            </View>

            <View style={[styles.inputContainer, styles.anoContainer]}>
              <Text style={styles.label}>Ano</Text>
              <TouchableOpacity style={styles.selectInput} onPress={() => setShowAnoModal(true)}>
                <Text style={[styles.selectText, !ano && styles.placeholderText]}>
                  {ano || 'Ano'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#666" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.toggleContainer}>
              <View style={styles.toggleLabelContainer}>
                <Text style={styles.label}>Possui seguro?</Text>
                <TouchableOpacity style={styles.infoButton} accessibilityLabel="Informação sobre seguro">
                  <Ionicons name="information-circle" size={18} color="#0055FF" />
                </TouchableOpacity>
              </View>
              <Switch
                value={possuiSeguro}
                onValueChange={setPossuiSeguro}
                trackColor={{ false: '#E0E0E0', true: '#0055FF' }}
                thumbColor={possuiSeguro ? '#fff' : '#f4f3f4'}
              />
            </View>
          </View>

          {possuiSeguro && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Informações do seguro</Text>
              <TextInput
                style={styles.input}
                placeholder="Nome da seguradora"
                placeholderTextColor="#999"
                value={insuranceCompany}
                onChangeText={(text) => setInsuranceCompany(formatInsuranceCompanyInput(text))}
                autoCapitalize="words"
                maxLength={60}
              />
              <TextInput
                style={[styles.input, styles.insuranceGap]}
                placeholder="Número da apólice"
                placeholderTextColor="#999"
                value={insurancePolicy}
                onChangeText={(text) => setInsurancePolicy(formatInsurancePolicyInput(text))}
                autoCapitalize="characters"
                maxLength={19}
              />
              <TextInput
                style={[styles.input, styles.insuranceGap]}
                placeholder="Validade (AAAA-MM-DD)"
                placeholderTextColor="#999"
                value={insuranceValidUntil}
                onChangeText={(text) => setInsuranceValidUntil(formatInsuranceValidUntilInput(text))}
                keyboardType="number-pad"
                maxLength={10}
              />
            </View>
          )}

          <TouchableOpacity
            style={[styles.primaryButton, !isFormValid && styles.primaryButtonDisabled]}
            onPress={handleAdd}
            disabled={!isFormValid}
          >
            <Text style={styles.primaryButtonText}>{submitLabel}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={showPlacaInfo}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPlacaInfo(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Formato da placa</Text>
              <TouchableOpacity onPress={() => setShowPlacaInfo(false)} accessibilityLabel="Fechar">
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.modalBodyText}>
                As placas seguem o padrão LLL-NLNN, onde L = letra e N = número.
              </Text>
              <Text style={[styles.modalBodyText, styles.modalBodyTextGap]}>Exemplo: ABC-1A23</Text>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showTipoModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTipoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecione o tipo</Text>
              <TouchableOpacity onPress={() => setShowTipoModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            {tipos.map((item) => (
              <TouchableOpacity
                key={item}
                style={styles.modalItem}
                onPress={() => {
                  setTipo(item);
                  setShowTipoModal(false);
                }}
              >
                <Text style={styles.modalItemText}>{item}</Text>
                {tipo === item ? <Ionicons name="checkmark" size={22} color="#0055FF" /> : null}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      <Modal
        visible={showAnoModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAnoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecione o ano</Text>
              <TouchableOpacity onPress={() => setShowAnoModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView}>
              {anos.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={styles.modalItem}
                  onPress={() => {
                    setAno(item);
                    setShowAnoModal(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item}</Text>
                  {ano === item ? <Ionicons name="checkmark" size={22} color="#0055FF" /> : null}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
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
    paddingBottom: 16,
    backgroundColor: 'rgb(215, 239, 253)',
  },
  backButton: {
    ...headerIconButton,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  helpButton: {
    ...headerIconButton,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  formCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  formSubtitle: {
    fontSize: 15,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modeloContainer: {
    flex: 1,
    marginRight: 10,
    marginBottom: 0,
  },
  anoContainer: {
    width: 120,
    marginBottom: 0,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0055FF',
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#FAFAFA',
  },
  insuranceGap: {
    marginTop: 12,
  },
  placaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  placaBox: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingVertical: 14,
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    backgroundColor: '#FAFAFA',
    textAlign: 'center',
  },
  placaBoxLeft: {
    flex: 1,
    marginRight: 8,
  },
  placaDash: {
    fontSize: 22,
    fontWeight: '600',
    color: '#666',
    marginRight: 8,
  },
  placaBoxRight: {
    flex: 1.4,
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    lineHeight: 18,
  },
  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FAFAFA',
  },
  selectText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  placeholderText: {
    color: '#999',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoButton: {
    marginLeft: 4,
    ...compactIconButton,
  },
  primaryButton: {
    backgroundColor: '#0055FF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#0055FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 12,
  },
  cancelText: {
    color: '#666',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalBody: {
    padding: 20,
    paddingBottom: 28,
  },
  modalBodyText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  modalBodyTextGap: {
    marginTop: 10,
  },
  modalScrollView: {
    maxHeight: 400,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
  },
});
