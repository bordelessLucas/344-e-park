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
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { DriverLicense, DriverLicenseCategory } from '../../types/driverLicense';
import {
  getAllDriverLicenses,
  saveDriverLicense,
  updateDriverLicense,
  deleteDriverLicense,
  checkLicenseStatus,
} from '../../services/driverLicenseService';

interface DriverLicensePageProps {
  onBack: () => void;
}

const { width } = Dimensions.get('window');

export const DriverLicensePage: React.FC<DriverLicensePageProps> = ({ onBack }) => {
  const [licenses, setLicenses] = useState<DriverLicense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingLicense, setEditingLicense] = useState<DriverLicense | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Form fields
  const [number, setNumber] = useState('');
  const [category, setCategory] = useState<DriverLicenseCategory | ''>('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [holderName, setHolderName] = useState('');
  const [cpf, setCpf] = useState('');
  const [observations, setObservations] = useState('');

  const categories: DriverLicenseCategory[] = ['A', 'B', 'C', 'D', 'E', 'AB', 'AC', 'AD', 'AE'];

  useEffect(() => {
    loadLicenses();
  }, []);

  const loadLicenses = async () => {
    setIsLoading(true);
    try {
      const data = await getAllDriverLicenses();
      setLicenses(data);
    } catch (error) {
      Alert.alert('Erro', 'Erro ao carregar documentos de habilitação');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingLicense(null);
    resetForm();
    setShowAddEditModal(true);
  };

  const handleOpenEditModal = (license: DriverLicense) => {
    setEditingLicense(license);
    setNumber(license.number);
    setCategory(license.category as DriverLicenseCategory);
    setIssueDate(license.issueDate);
    setExpiryDate(license.expiryDate);
    setHolderName(license.holderName);
    setCpf(license.cpf);
    setObservations(license.observations || '');
    setShowAddEditModal(true);
  };

  const resetForm = () => {
    setNumber('');
    setCategory('');
    setIssueDate('');
    setExpiryDate('');
    setHolderName('');
    setCpf('');
    setObservations('');
  };

  const validateForm = (): boolean => {
    if (!number.trim()) {
      Alert.alert('Erro', 'Informe o número do registro (CNH)');
      return false;
    }
    if (!category) {
      Alert.alert('Erro', 'Selecione a categoria da CNH');
      return false;
    }
    if (!issueDate.trim()) {
      Alert.alert('Erro', 'Informe a data de emissão');
      return false;
    }
    if (!expiryDate.trim()) {
      Alert.alert('Erro', 'Informe a data de validade');
      return false;
    }
    if (!holderName.trim()) {
      Alert.alert('Erro', 'Informe o nome do titular');
      return false;
    }
    if (!cpf.trim()) {
      Alert.alert('Erro', 'Informe o CPF do titular');
      return false;
    }

    // Validar formato de data (AAAA-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(issueDate)) {
      Alert.alert('Erro', 'Data de emissão inválida. Use o formato AAAA-MM-DD');
      return false;
    }
    if (!dateRegex.test(expiryDate)) {
      Alert.alert('Erro', 'Data de validade inválida. Use o formato AAAA-MM-DD');
      return false;
    }

    // Validar CPF (formato básico)
    const cpfClean = cpf.replace(/\D/g, '');
    if (cpfClean.length !== 11) {
      Alert.alert('Erro', 'CPF inválido. Deve conter 11 dígitos');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      if (editingLicense) {
        // Atualizar CNH existente
        await updateDriverLicense(editingLicense.id, {
          number,
          category,
          issueDate,
          expiryDate,
          holderName,
          cpf,
          observations,
        });
        Alert.alert('Sucesso', 'CNH atualizada com sucesso!');
      } else {
        // Adicionar nova CNH
        await saveDriverLicense({
          number,
          category,
          issueDate,
          expiryDate,
          holderName,
          cpf,
          observations,
        });
        Alert.alert('Sucesso', 'CNH adicionada com sucesso!');
      }
      
      setShowAddEditModal(false);
      resetForm();
      loadLicenses();
    } catch (error) {
      Alert.alert('Erro', 'Erro ao salvar CNH');
    }
  };

  const handleDelete = (license: DriverLicense) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Deseja realmente excluir a CNH ${license.number}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDriverLicense(license.id);
              Alert.alert('Sucesso', 'CNH excluída com sucesso!');
              loadLicenses();
            } catch (error) {
              Alert.alert('Erro', 'Erro ao excluir CNH');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString + 'T00:00:00');
      return date.toLocaleDateString('pt-BR');
    } catch {
      return dateString;
    }
  };

  const formatCPF = (cpf: string): string => {
    const clean = cpf.replace(/\D/g, '');
    return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const getStatusColor = (status: 'valid' | 'expiring' | 'expired'): string => {
    switch (status) {
      case 'valid':
        return '#4CAF50';
      case 'expiring':
        return '#FF9800';
      case 'expired':
        return '#F44336';
      default:
        return '#666';
    }
  };

  const getStatusLabel = (status: 'valid' | 'expiring' | 'expired'): string => {
    switch (status) {
      case 'valid':
        return 'Válida';
      case 'expiring':
        return 'Vence em breve';
      case 'expired':
        return 'Vencida';
      default:
        return '-';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0055FF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>CNH Protegida</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <View style={styles.infoIcon}>
          <Ionicons name="person-outline" size={32} color="#0055FF" />
        </View>
        <Text style={styles.infoTitle}>Controle Total de Sua Habilitação</Text>
        <Text style={styles.infoText}>
          Gerencie seus documentos de habilitação, acompanhe validades e mantenha tudo organizado em um só lugar.
        </Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#0055FF" style={styles.loader} />
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {licenses.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={64} color="#ccc" />
              <Text style={styles.emptyTitle}>Nenhuma CNH cadastrada</Text>
              <Text style={styles.emptyText}>
                Adicione sua carteira de habilitação para ter maior controle e segurança.
              </Text>
            </View>
          ) : (
            licenses.map((license) => {
              const { status, daysUntilExpiry } = checkLicenseStatus(license.expiryDate);
              return (
                <View key={license.id} style={styles.licenseCard}>
                  <View style={styles.licenseHeader}>
                    <View style={styles.licenseHeaderLeft}>
                      <Text style={styles.licenseNumber}>{license.number}</Text>
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>Categoria {license.category}</Text>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(status) + '20' },
                      ]}
                    >
                      <Text style={[styles.statusText, { color: getStatusColor(status) }]}>
                        {getStatusLabel(status)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.licenseInfo}>
                    <View style={styles.infoRow}>
                      <Ionicons name="person" size={16} color="#666" />
                      <Text style={styles.infoLabel}>Titular:</Text>
                      <Text style={styles.infoValue}>{license.holderName}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Ionicons name="card" size={16} color="#666" />
                      <Text style={styles.infoLabel}>CPF:</Text>
                      <Text style={styles.infoValue}>{formatCPF(license.cpf)}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Ionicons name="calendar" size={16} color="#666" />
                      <Text style={styles.infoLabel}>Emissão:</Text>
                      <Text style={styles.infoValue}>{formatDate(license.issueDate)}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Ionicons name="calendar-outline" size={16} color="#666" />
                      <Text style={styles.infoLabel}>Validade:</Text>
                      <Text style={styles.infoValue}>{formatDate(license.expiryDate)}</Text>
                    </View>
                    {status === 'expiring' && (
                      <View style={styles.warningBox}>
                        <Ionicons name="warning" size={16} color="#FF9800" />
                        <Text style={styles.warningText}>
                          Vence em {daysUntilExpiry} {daysUntilExpiry === 1 ? 'dia' : 'dias'}
                        </Text>
                      </View>
                    )}
                    {status === 'expired' && (
                      <View style={[styles.warningBox, { backgroundColor: '#FFEBEE' }]}>
                        <Ionicons name="close-circle" size={16} color="#F44336" />
                        <Text style={[styles.warningText, { color: '#F44336' }]}>
                          CNH vencida há {Math.abs(daysUntilExpiry)} {Math.abs(daysUntilExpiry) === 1 ? 'dia' : 'dias'}
                        </Text>
                      </View>
                    )}
                    {license.observations && (
                      <View style={styles.observationsBox}>
                        <Text style={styles.observationsLabel}>Observações:</Text>
                        <Text style={styles.observationsText}>{license.observations}</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.licenseActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleOpenEditModal(license)}
                    >
                      <Ionicons name="create-outline" size={20} color="#0055FF" />
                      <Text style={styles.actionButtonText}>Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => handleDelete(license)}
                    >
                      <Ionicons name="trash-outline" size={20} color="#F44336" />
                      <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Excluir</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Add Button */}
      <TouchableOpacity style={styles.addButton} onPress={handleOpenAddModal}>
        <Ionicons name="add" size={28} color="#FFF" />
      </TouchableOpacity>

      {/* Add/Edit Modal */}
      <Modal
        visible={showAddEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingLicense ? 'Editar CNH' : 'Adicionar CNH'}
              </Text>
              <TouchableOpacity onPress={() => setShowAddEditModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Número do Registro (CNH) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 12345678900"
                  placeholderTextColor="#999"
                  value={number}
                  onChangeText={setNumber}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Categoria *</Text>
                <TouchableOpacity
                  style={styles.selectInput}
                  onPress={() => setShowCategoryModal(true)}
                >
                  <Text style={[styles.selectText, !category && styles.placeholderText]}>
                    {category || 'Selecione a categoria'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Nome do Titular *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nome completo"
                  placeholderTextColor="#999"
                  value={holderName}
                  onChangeText={setHolderName}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>CPF *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="000.000.000-00"
                  placeholderTextColor="#999"
                  value={cpf}
                  onChangeText={setCpf}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Data de Emissão *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="AAAA-MM-DD (Ex: 2020-05-15)"
                  placeholderTextColor="#999"
                  value={issueDate}
                  onChangeText={setIssueDate}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Data de Validade *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="AAAA-MM-DD (Ex: 2030-05-15)"
                  placeholderTextColor="#999"
                  value={expiryDate}
                  onChangeText={setExpiryDate}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Observações</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Adicione observações (opcional)"
                  placeholderTextColor="#999"
                  value={observations}
                  onChangeText={setObservations}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>
                  {editingLicense ? 'Salvar Alterações' : 'Adicionar CNH'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Category Selection Modal */}
      <Modal
        visible={showCategoryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.smallModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecione a Categoria</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={styles.categoryOption}
                  onPress={() => {
                    setCategory(cat);
                    setShowCategoryModal(false);
                  }}
                >
                  <Text style={styles.categoryOptionText}>Categoria {cat}</Text>
                  {category === cat && (
                    <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                  )}
                </TouchableOpacity>
              ))}
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
  placeholder: {
    width: 32,
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
    marginBottom: 16,
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
  loader: {
    marginTop: 40,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  licenseCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  licenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  licenseHeaderLeft: {
    flex: 1,
  },
  licenseNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0055FF',
    marginBottom: 6,
  },
  categoryBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0055FF',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  licenseInfo: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
    marginRight: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  warningText: {
    fontSize: 13,
    color: '#FF9800',
    fontWeight: '500',
    marginLeft: 6,
  },
  observationsBox: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  observationsLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  observationsText: {
    fontSize: 14,
    color: '#333',
  },
  licenseActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#E3F2FD',
    marginHorizontal: 4,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0055FF',
    marginLeft: 6,
  },
  deleteButton: {
    backgroundColor: '#FFEBEE',
  },
  deleteButtonText: {
    color: '#F44336',
  },
  addButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0055FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
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
    maxHeight: '90%',
    paddingBottom: 20,
  },
  smallModalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '60%',
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
  modalScroll: {
    paddingHorizontal: 20,
    paddingTop: 20,
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
  selectInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#FFF',
  },
  selectText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    color: '#999',
  },
  saveButton: {
    backgroundColor: '#0055FF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  categoryOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  categoryOptionText: {
    fontSize: 16,
    color: '#333',
  },
});
