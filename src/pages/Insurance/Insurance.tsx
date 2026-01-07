import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  Linking,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { VehicleData } from '../AddVehicle/AddVehicle';

interface InsuranceProps {
  onBack: () => void;
  vehicles?: VehicleData[];
}

interface InsuranceProvider {
  id: string;
  name: string;
  phone: string;
  website: string;
  hasQuote: boolean;
  coverage: string[];
}

const insuranceProviders: InsuranceProvider[] = [
  {
    id: '1',
    name: 'Bradesco Seguros',
    phone: '0800 646 3000',
    website: 'https://www.bradescoseguros.com.br',
    hasQuote: true,
    coverage: ['Cobertura Total', 'Roubo e Furto', 'Vidros', 'Assistência 24h'],
  },
  {
    id: '2',
    name: 'Itaú Seguros',
    phone: '0800 646 3644',
    website: 'https://www.itauseguros.com.br',
    hasQuote: true,
    coverage: ['Cobertura Total', 'Roubo e Furto', 'Enchentes', 'Assistência 24h'],
  },
  {
    id: '3',
    name: 'Seguros Unimed',
    phone: '0800 011 5555',
    website: 'https://www.segurosunimed.com.br',
    hasQuote: true,
    coverage: ['Cobertura Compreensiva', 'Roubo e Furto', 'Vidros', 'Serviços Especiais'],
  },
  {
    id: '4',
    name: 'SulAmérica Seguros',
    phone: '0800 722 8822',
    website: 'https://www.sulamericaseguros.com.br',
    hasQuote: true,
    coverage: ['Cobertura Total', 'Roubo e Furto', 'Enchentes', 'Danos Elétricos'],
  },
  {
    id: '5',
    name: 'Liberty Seguros',
    phone: '0800 707 1111',
    website: 'https://www.libertyseguros.com.br',
    hasQuote: true,
    coverage: ['Cobertura Total', 'Roubo e Furto', 'Terceiros', 'Assistência 24h'],
  },
  {
    id: '6',
    name: 'Caixa Seguros',
    phone: '0800 726 0000',
    website: 'https://www.caixaseguros.com.br',
    hasQuote: true,
    coverage: ['Cobertura Total', 'Roubo e Furto', 'Incêndio', 'Assistência 24h'],
  },
];

export const Insurance: React.FC<InsuranceProps> = ({ onBack, vehicles = [] }: InsuranceProps) => {
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleData | null>(null);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showProviderDetails, setShowProviderDetails] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<InsuranceProvider | null>(null);

  const handleSelectVehicle = (vehicle: VehicleData) => {
    setSelectedVehicle(vehicle);
    setShowVehicleModal(false);
  };

  const handleViewProviderDetails = (provider: InsuranceProvider) => {
    setSelectedProvider(provider);
    setShowProviderDetails(true);
  };

  const handleCallProvider = (phone: string) => {
    const phoneUrl = `tel:${phone.replace(/\D/g, '')}`;
    Linking.openURL(phoneUrl).catch(() => {
      Alert.alert('Erro', 'Não foi possível fazer a ligação');
    });
  };

  const handleVisitWebsite = (website: string) => {
    Linking.openURL(website).catch(() => {
      Alert.alert('Erro', 'Não foi possível abrir o navegador');
    });
  };

  const handleRequestQuote = (provider: InsuranceProvider) => {
    Alert.alert(
      'Solicitação de Orçamento',
      `Redirecionando para ${provider.name}...\n\nVocê será levado para o site deles para solicitar um orçamento customizado.`,
      [
        { text: 'Cancelar', onPress: () => {} },
        {
          text: 'Ir para o site',
          onPress: () => handleVisitWebsite(provider.website),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0055FF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Seguros</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <Ionicons name="shield-checkmark" size={32} color="#0055FF" />
          </View>
          <Text style={styles.infoTitle}>Cotação e Contatos de Seguros</Text>
          <Text style={styles.infoText}>
            Conheça as principais seguradoras do Brasil, compare cotações e encontre o melhor seguro para seu veículo.
          </Text>
        </View>

        {/* Vehicle Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Seu Veículo</Text>
          <TouchableOpacity
            style={styles.vehicleSelector}
            onPress={() => {
              if (vehicles.length === 0) {
                Alert.alert(
                  'Nenhum Veículo',
                  'Você não possui veículos cadastrados. Cadastre um veículo para usar este serviço.'
                );
                return;
              }
              setShowVehicleModal(true);
            }}
          >
            {selectedVehicle ? (
              <View style={styles.selectedVehicleInfo}>
                <Text style={styles.vehiclePlaca}>{selectedVehicle.placa}</Text>
                <Text style={styles.vehicleModelo}>
                  {selectedVehicle.modelo} • {selectedVehicle.ano}
                </Text>
                <Text style={styles.vehicleTipo}>{selectedVehicle.tipo}</Text>
                {selectedVehicle.possuiSeguro && (
                  <View style={styles.insuranceBadge}>
                    <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                    <Text style={styles.insuranceBadgeText}>Com Seguro</Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.placeholderContainer}>
                <Ionicons name="car-outline" size={24} color="#999" />
                <Text style={styles.vehiclePlaceholder}>
                  {vehicles.length === 0
                    ? 'Nenhum veículo cadastrado'
                    : 'Toque para selecionar um veículo'}
                </Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={20} color="#0055FF" />
          </TouchableOpacity>
        </View>

        {/* Insurance Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prazos Importantes</Text>
          <View style={styles.infoBox}>
            <View style={styles.infoItem}>
              <Ionicons name="calendar" size={20} color="#0055FF" />
              <View style={styles.infoItemText}>
                <Text style={styles.infoItemTitle}>Vencimento da Apólice</Text>
                <Text style={styles.infoItemValue}>
                  {selectedVehicle?.insurance?.validUntil || 'Sem seguro ativo'}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoItem}>
              <Ionicons name="card" size={20} color="#0055FF" />
              <View style={styles.infoItemText}>
                <Text style={styles.infoItemTitle}>Data de Pagamento</Text>
                <Text style={styles.infoItemValue}>Consulte sua seguradora</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Seguradoras */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Principais Seguradoras</Text>

          {insuranceProviders.map((provider, index) => (
            <View key={provider.id} style={styles.providerCard}>
              <View style={styles.providerIcon}>
                <Ionicons name="business" size={28} color="#FFFFFF" />
              </View>

              <View style={styles.providerInfo}>
                <Text style={styles.providerName}>{provider.name}</Text>
                <View style={styles.providerContact}>
                  <Ionicons name="call" size={14} color="#666" />
                  <Text style={styles.providerPhone}>{provider.phone}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.detailsButton}
                onPress={() => handleViewProviderDetails(provider)}
              >
                <Ionicons name="chevron-forward" size={20} color="#0055FF" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Tips Section */}
        <View style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <Ionicons name="bulb-outline" size={24} color="#0055FF" />
            <Text style={styles.tipsTitle}>Dicas Importantes</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
            <Text style={styles.tipText}>
              Sempre tenha seu seguro em dia para estar protegido
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
            <Text style={styles.tipText}>
              Compare cotações de diferentes seguradoras antes de contratar
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
            <Text style={styles.tipText}>
              Mantenha os documentos do seguro sempre acessíveis
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
            <Text style={styles.tipText}>
              Revise a cobertura anualmente para garantir proteção adequada
            </Text>
          </View>
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
              <Text style={styles.modalTitle}>Selecione o veículo</Text>
              <TouchableOpacity onPress={() => setShowVehicleModal(false)}>
                <Ionicons name="close" size={24} color="#0055FF" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              {vehicles.map((vehicle, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.modalItem}
                  onPress={() => handleSelectVehicle(vehicle)}
                >
                  <View style={styles.vehicleItemInfo}>
                    <View style={styles.vehicleIcon}>
                      <Ionicons
                        name={
                          vehicle.tipo === 'Carro'
                            ? 'car'
                            : vehicle.tipo === 'Motocicleta'
                            ? 'bicycle'
                            : 'bus'
                        }
                        size={24}
                        color="#0055FF"
                      />
                    </View>
                    <View style={styles.vehicleDetails}>
                      <Text style={styles.vehicleItemPlaca}>{vehicle.placa}</Text>
                      <Text style={styles.vehicleItemModelo}>
                        {vehicle.modelo} • {vehicle.ano}
                      </Text>
                      <Text style={styles.vehicleItemTipo}>{vehicle.tipo}</Text>
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

      {/* Provider Details Modal */}
      <Modal
        visible={showProviderDetails}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowProviderDetails(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedProvider?.name}
              </Text>
              <TouchableOpacity onPress={() => setShowProviderDetails(false)}>
                <Ionicons name="close" size={24} color="#0055FF" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.detailsScroll}>
              {/* Contact Info */}
              <View style={styles.detailsSection}>
                <Text style={styles.detailsTitle}>Contato</Text>
                <TouchableOpacity
                  style={styles.contactButton}
                  onPress={() => selectedProvider && handleCallProvider(selectedProvider.phone)}
                >
                  <Ionicons name="call" size={20} color="#0055FF" />
                  <Text style={styles.contactButtonText}>
                    {selectedProvider?.phone}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.contactButton}
                  onPress={() => selectedProvider && handleVisitWebsite(selectedProvider.website)}
                >
                  <Ionicons name="globe" size={20} color="#0055FF" />
                  <Text style={styles.contactButtonText}>
                    Visitar Site
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Coverage */}
              <View style={styles.detailsSection}>
                <Text style={styles.detailsTitle}>Coberturas Disponíveis</Text>
                {selectedProvider?.coverage.map((item: string, index: number) => (
                  <View key={index} style={styles.coverageItem}>
                    <Ionicons name="checkmark" size={18} color="#4CAF50" />
                    <Text style={styles.coverageText}>{item}</Text>
                  </View>
                ))}
              </View>

              {/* Quote Button */}
              <TouchableOpacity
                style={styles.quoteButton}
                onPress={() => selectedProvider && handleRequestQuote(selectedProvider)}
              >
                <Ionicons name="document-text" size={20} color="#FFFFFF" />
                <Text style={styles.quoteButtonText}>Solicitar Orçamento</Text>
              </TouchableOpacity>
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
    backgroundColor: 'rgb(215, 239, 253)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: 'rgb(215, 239, 253)',
  },
  backButton: {
    padding: 8,
    width: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0055FF',
  },
  scrollView: {
    flex: 1,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
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
    backgroundColor: 'rgba(0, 85, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
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
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0055FF',
    marginBottom: 12,
  },
  vehicleSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  selectedVehicleInfo: {
    flex: 1,
  },
  vehiclePlaca: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0055FF',
    marginBottom: 4,
  },
  vehicleModelo: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  vehicleTipo: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  insuranceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
  },
  insuranceBadgeText: {
    fontSize: 11,
    color: '#4CAF50',
    marginLeft: 4,
    fontWeight: '600',
  },
  placeholderContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehiclePlaceholder: {
    fontSize: 14,
    color: '#999',
    marginLeft: 12,
  },
  infoBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoItemText: {
    marginLeft: 12,
    flex: 1,
  },
  infoItemTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  infoItemValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0055FF',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  providerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  providerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4A9EFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0055FF',
    marginBottom: 6,
  },
  providerContact: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerPhone: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
  },
  detailsButton: {
    padding: 8,
  },
  tipsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 30,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    marginLeft: 8,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
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
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
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
    fontWeight: 'bold',
    color: '#0055FF',
    marginBottom: 4,
  },
  vehicleItemModelo: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  vehicleItemTipo: {
    fontSize: 12,
    color: '#666',
  },
  detailsScroll: {
    maxHeight: Dimensions.get('window').height * 0.6,
  },
  detailsSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0055FF',
    marginBottom: 12,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  contactButtonText: {
    fontSize: 14,
    color: '#0055FF',
    fontWeight: '600',
    marginLeft: 10,
  },
  coverageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  coverageText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 10,
  },
  quoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0055FF',
    padding: 16,
    borderRadius: 12,
    margin: 20,
  },
  quoteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});
