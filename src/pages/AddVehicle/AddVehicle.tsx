import React, { useEffect, useState } from 'react';
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

export const AddVehicle: React.FC<AddVehicleProps> = ({
  onCancel,
  onAdd,
  initialVehicle = null,
  title = 'Adicionar veículo',
  submitLabel = 'Adicionar',
}) => {
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

  const tipos = ['Carro', 'Motocicleta', 'Caminhão/Ônibus'];
  
  // Gerar anos de 2025 até 1980
  const anos = Array.from({ length: 45 }, (_, i) => (2025 - i).toString());

  const placaCompleta = `${placaLetras}-${placaNumeros}`;
  const placaPatternRegex = /^(?:[0-9][A-Z][0-9]{2}|[0-9]{4})$/;
  const isFormValid = placaLetras.trim().length === 3 && placaPatternRegex.test(placaNumeros) && tipo !== '' && modelo.trim() !== '' && ano !== '';

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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <TouchableOpacity style={styles.helpButton}>
          <Ionicons name="help-circle-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Placa Input */}
        <View style={styles.inputContainer}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Placa</Text>
            <TouchableOpacity style={styles.infoButton} onPress={() => setShowPlacaInfo(true)}>
              <Ionicons name="information-circle" size={16} color="#0055FF" />
            </TouchableOpacity>
          </View>
          <View style={styles.placaContainer}>
            <TextInput
              style={[styles.placaInput, styles.placaLeft]}
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
            <Text style={styles.placaSeparator}>-</Text>
            <TextInput
              style={[styles.placaInput, styles.placaRight]}
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
          <Text style={styles.helperText}>Formato: LLL-NLNN (L = letra, N = número). Ex.: ABC-1A23. Placas antigas com 4 números também são aceitas: ABC-1234</Text>
        </View>

        {/* Tipo Select */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Tipo</Text>
          <TouchableOpacity
            style={styles.selectInput}
            onPress={() => setShowTipoModal(true)}
          >
            <Text style={[styles.selectText, !tipo && styles.placeholderText]}>
              {tipo || 'Selecione o tipo'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Modelo e Ano em linha */}
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
            <TouchableOpacity
              style={styles.selectInput}
              onPress={() => setShowAnoModal(true)}
            >
              <Text style={[styles.selectText, !ano && styles.placeholderText]}>
                {ano || 'Selecione o ano'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Possui Seguro Toggle */}
        <View style={styles.inputContainer}>
          <View style={styles.toggleContainer}>
            <View style={styles.toggleLabelContainer}>
              <Text style={styles.label}>Possui seguro?</Text>
              <TouchableOpacity style={styles.infoButton}>
                <Ionicons name="information-circle" size={16} color="#0055FF" />
              </TouchableOpacity>
            </View>
            <Switch
              value={possuiSeguro}
              onValueChange={setPossuiSeguro}
              trackColor={{ false: '#767577', true: '#0055FF' }}
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
              onChangeText={setInsuranceCompany}
            />
            <TextInput
              style={[styles.input, { marginTop: 12 }]}
              placeholder="Número da apólice"
              placeholderTextColor="#999"
              value={insurancePolicy}
              onChangeText={setInsurancePolicy}
              autoCapitalize="characters"
            />
            <TextInput
              style={[styles.input, { marginTop: 12 }]}
              placeholder="Validade (AAAA-MM-DD)"
              placeholderTextColor="#999"
              value={insuranceValidUntil}
              onChangeText={setInsuranceValidUntil}
            />
          </View>
        )}

        {/* Adicionar Button */}
        <TouchableOpacity
          style={[styles.addButton, !isFormValid && styles.addButtonDisabled]}
          onPress={handleAdd}
          disabled={!isFormValid}
        >
          <Text style={styles.addButtonText}>{submitLabel}</Text>
        </TouchableOpacity>

        {/* Cancelar Link */}
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelText}>Cancelar</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Placa Info Modal */}
      <Modal
        visible={showPlacaInfo}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPlacaInfo(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Formato da placa</Text>
              <TouchableOpacity onPress={() => setShowPlacaInfo(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={{ padding: 20 }}>
              <Text style={styles.modalItemText}>As placas seguem o padrão LLL-NLNN, onde L = letra e N = número.</Text>
              <Text style={[styles.modalItemText, { marginTop: 10 }]}>Exemplo: ABC-1A23</Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Tipo Modal */}
      <Modal
        visible={showTipoModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTipoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecione o tipo</Text>
              <TouchableOpacity onPress={() => setShowTipoModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
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
                {tipo === item && (
                  <Ionicons name="checkmark" size={20} color="#0055FF" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Ano Modal */}
      <Modal
        visible={showAnoModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAnoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecione o ano</Text>
              <TouchableOpacity onPress={() => setShowAnoModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
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
                  {ano === item && (
                    <Ionicons name="checkmark" size={20} color="#0055FF" />
                  )}
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
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  helpButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  inputContainer: {
    marginBottom: 24,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  modeloContainer: {
    flex: 1,
    marginRight: 12,
    marginBottom: 0,
  },
  anoContainer: {
    flex: 0.6,
    marginLeft: 12,
    marginBottom: 0,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingVertical: 12,
    fontSize: 16,
    color: '#fff',
    backgroundColor: 'transparent',
  },
  placaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingBottom: 12,
  },
  placaInput: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    backgroundColor: 'transparent',
    textAlign: 'center',
  },
  placaLeft: {
    flex: 1,
  },
  placaSeparator: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    marginHorizontal: 8,
  },
  placaRight: {
    flex: 1.5,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingVertical: 12,
  },
  selectText: {
    fontSize: 16,
    color: '#fff',
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
  },
  infoButton: {
    marginLeft: 8,
    padding: 4,
  },
  addButton: {
    backgroundColor: '#333',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 12,
  },
  cancelText: {
    color: '#666',
    fontSize: 16,
    textDecorationLine: 'underline',
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
    borderBottomColor: '#333',
  },
  modalItemText: {
    fontSize: 16,
    color: '#fff',
  },
});

