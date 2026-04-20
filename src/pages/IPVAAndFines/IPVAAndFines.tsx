import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { headerIconButton } from '../../theme/touchTargets';
import { VehicleData } from '../AddVehicle/AddVehicle';
import {
  getVehicleRecord,
  type Fine,
  type IPVAInfo,
  type LicensingInfo,
  type VehicleRecord,
} from '../../services/vehicleInfoService';

interface IPVAAndFinesProps {
  onBack: () => void;
  vehicles?: VehicleData[];
}

export const IPVAAndFines: React.FC<IPVAAndFinesProps> = ({ onBack, vehicles = [] }: IPVAAndFinesProps) => {
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleData | null>(null);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [vehicleRecord, setVehicleRecord] = useState<VehicleRecord | null>(null);
  const [dataSource, setDataSource] = useState<'api' | 'mock' | 'hybrid' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'fines' | 'ipva' | 'licensing'>('overview');

  const handleSelectVehicle = (vehicle: VehicleData) => {
    setSelectedVehicle(vehicle);
    setShowVehicleModal(false);
    searchVehicleRecord(vehicle);
  };

  const searchVehicleRecord = async (vehicle: VehicleData) => {
    setIsLoading(true);
    setActiveTab('overview');
    try {
      const { record, source } = await getVehicleRecord(vehicle);
      setVehicleRecord(record);
      setDataSource(source);
    } catch (error) {
      Alert.alert('Erro', 'Erro ao buscar dados do veículo');
      setVehicleRecord(null);
      setDataSource(null);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString + 'T00:00:00');
      return date.toLocaleDateString('pt-BR');
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'paid':
      case 'valid':
        return '#4CAF50';
      case 'pending':
        return '#FF9800';
      case 'expired':
      case 'disputed':
        return '#FF5252';
      case 'expiring':
        return '#FFC107';
      default:
        return '#666';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'paid':
        return 'Pago';
      case 'pending':
        return 'Pendente';
      case 'disputed':
        return 'Contestado';
      case 'valid':
        return 'Válido';
      case 'expired':
        return 'Expirado';
      case 'expiring':
        return 'Vencendo';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string): any => {
    switch (status) {
      case 'paid':
      case 'valid':
        return 'checkmark-circle';
      case 'pending':
        return 'alert-circle';
      case 'disputed':
        return 'help-circle';
      case 'expired':
        return 'close-circle';
      case 'expiring':
        return 'warning';
      default:
        return 'information-circle';
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
        <Text style={styles.headerTitle}>IPVA, Multas & Licenciamento</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <Ionicons name="document-text" size={32} color="#0055FF" />
          </View>
          <Text style={styles.infoTitle}>Consulte Suas Obrigações Veiculares</Text>
          <Text style={styles.infoText}>
            Verifique informações de IPVA, multas de trânsito e situação do licenciamento do seu veículo.
          </Text>
          <Text style={styles.infoFootnote}>
            Alguns dados são estimados ou simulados para fins informativos. Não substitui consulta oficial em DETRAN,
            SEFAZ ou órgãos competentes. Opcionalmente, configure EXPO_PUBLIC_VEHICLE_INFO_API_BASE para receber JSON do
            seu backend.
          </Text>
        </View>

        {/* Vehicle Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Selecione um Veículo</Text>
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

        {/* Loading State */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0055FF" />
            <Text style={styles.loadingText}>Buscando dados do veículo...</Text>
          </View>
        )}

        {/* Results */}
        {vehicleRecord && !isLoading && (
          <>
            {dataSource === 'mock' ? (
              <View style={styles.sourceBannerMock}>
                <Ionicons name="information-circle-outline" size={22} color="#B87A00" style={styles.sourceBannerIcon} />
                <Text style={styles.sourceBannerMockText}>
                  Modo demonstração: valores ilustrativos (mesma placa → mesmos dados). Não substitui consulta oficial
                  nem débitos reais.
                </Text>
              </View>
            ) : dataSource === 'hybrid' ? (
              <View style={styles.sourceBannerHybrid}>
                <Ionicons name="analytics-outline" size={22} color="#1565C0" style={styles.sourceBannerIcon} />
                <Text style={styles.sourceBannerHybridText}>
                  Dados parciais: veículo e valor FIPE vêm de APIs públicas quando disponíveis; IPVA é estimado; multas e
                  licenciamento são simulados de forma determinística (mesma placa → mesmos resultados).
                </Text>
              </View>
            ) : dataSource === 'api' ? (
              <View style={styles.sourceBannerApi}>
                <Ionicons name="cloud-done-outline" size={22} color="#2E7D32" style={styles.sourceBannerIcon} />
                <Text style={styles.sourceBannerApiText}>
                  Dados recebidos do seu servidor (API configurada). Confira sempre no portal do DETRAN/SEFAZ do seu
                  estado.
                </Text>
              </View>
            ) : null}

            {(vehicleRecord.vehicle || vehicleRecord.fipeValue != null) && (
              <View style={styles.vehicleMetaCard}>
                <Text style={styles.vehicleMetaTitle}>Dados do veículo (referência)</Text>
                {vehicleRecord.vehicle && (
                  <>
                    <Text style={styles.vehicleMetaLine}>
                      {vehicleRecord.vehicle.brand} {vehicleRecord.vehicle.model} · {vehicleRecord.vehicle.year}
                    </Text>
                    <Text style={styles.vehicleMetaSub}>
                      Combustível: {vehicleRecord.vehicle.fuel}
                      {vehicleRecord.vehicle.dataOrigin === 'api'
                        ? ' · origem: consulta pública'
                        : vehicleRecord.vehicle.dataOrigin === 'cadastro'
                        ? ' · origem: cadastro'
                        : ''}
                    </Text>
                  </>
                )}
                {vehicleRecord.fipeValue != null && (
                  <Text style={styles.vehicleMetaFipe}>
                    Valor FIPE (referência): {formatCurrency(vehicleRecord.fipeValue)}
                  </Text>
                )}
              </View>
            )}

            {/* Summary Cards */}
            <View style={styles.summaryGrid}>
              {/* Multas Pendentes */}
              <TouchableOpacity
                style={[styles.summaryCard, vehicleRecord.totalFinesPending > 0 && styles.summaryCardWarning]}
                onPress={() => setActiveTab('fines')}
              >
                <View style={styles.summaryCardIcon}>
                  <Ionicons
                    name="alert-circle"
                    size={28}
                    color={vehicleRecord.totalFinesPending > 0 ? '#FF5252' : '#4CAF50'}
                  />
                </View>
                <Text style={styles.summaryCardValue}>{vehicleRecord.totalFinesPending}</Text>
                <Text style={styles.summaryCardLabel}>Multas Pendentes</Text>
                {vehicleRecord.totalFinesPending > 0 && (
                  <Text style={styles.summaryCardAmount}>
                    {formatCurrency(vehicleRecord.totalFinesPendingValue)}
                  </Text>
                )}
              </TouchableOpacity>

              {/* IPVA */}
              <TouchableOpacity
                style={[
                  styles.summaryCard,
                  vehicleRecord.ipva.some((i: any) => i.status === 'pending') && styles.summaryCardWarning,
                ]}
                onPress={() => setActiveTab('ipva')}
              >
                <View style={styles.summaryCardIcon}>
                  <Ionicons
                    name="document"
                    size={28}
                    color={vehicleRecord.ipva.some((i: any) => i.status === 'pending') ? '#FF9800' : '#4CAF50'}
                  />
                </View>
                <Text style={styles.summaryCardValue}>{vehicleRecord.ipva.length}</Text>
                <Text style={styles.summaryCardLabel}>Anos de IPVA</Text>
              </TouchableOpacity>

              {/* Licenciamento */}
              <TouchableOpacity
                style={[
                  styles.summaryCard,
                  vehicleRecord.licensing.status !== 'valid' && styles.summaryCardWarning,
                ]}
                onPress={() => setActiveTab('licensing')}
              >
                <View style={styles.summaryCardIcon}>
                  <Ionicons
                    name={vehicleRecord.licensing.status === 'valid' ? 'checkmark-circle' : 'warning'}
                    size={28}
                    color={vehicleRecord.licensing.status === 'valid' ? '#4CAF50' : '#FF9800'}
                  />
                </View>
                <Text style={styles.summaryCardLabel}>Licenciamento</Text>
                <Text style={[styles.summaryCardStatus, { color: getStatusColor(vehicleRecord.licensing.status) }]}>
                  {getStatusLabel(vehicleRecord.licensing.status)}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Tab Navigation */}
            <View style={styles.tabContainer}>
              {['overview', 'fines', 'ipva', 'licensing'].map(tab => (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tab, activeTab === tab && styles.tabActive]}
                  onPress={() => setActiveTab(tab as any)}
                >
                  <Text
                    style={[
                      styles.tabLabel,
                      activeTab === tab && styles.tabLabelActive,
                    ]}
                  >
                    {tab === 'overview' ? 'Resumo' : tab === 'fines' ? 'Multas' : tab === 'ipva' ? 'IPVA' : 'Lic.'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Tab Content */}
            <View style={styles.tabContent}>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <View>
                  <View style={styles.contentSection}>
                    <Text style={styles.contentTitle}>Resumo Geral</Text>
                    <View style={styles.infoBox}>
                      <View style={styles.infoRow}>
                        <View style={styles.infoRowLeft}>
                          <Ionicons name="alert-circle" size={20} color="#FF5252" />
                          <Text style={styles.infoRowLabel}>Multas Pendentes</Text>
                        </View>
                        <Text style={styles.infoRowValue}>
                          {vehicleRecord.totalFinesPending} ({formatCurrency(vehicleRecord.totalFinesPendingValue)})
                        </Text>
                      </View>

                      <View style={styles.divider} />

                      <View style={styles.infoRow}>
                        <View style={styles.infoRowLeft}>
                          <Ionicons
                            name={vehicleRecord.ipva.some((i: any) => i.status === 'pending') ? 'alert' : 'checkmark-circle'}
                            size={20}
                            color={vehicleRecord.ipva.some((i: any) => i.status === 'pending') ? '#FF9800' : '#4CAF50'}
                          />
                          <Text style={styles.infoRowLabel}>IPVA Pendente</Text>
                        </View>
                        <Text style={styles.infoRowValue}>
                          {vehicleRecord.ipva.filter((i: any) => i.status === 'pending').length} ano(s)
                        </Text>
                      </View>

                      <View style={styles.divider} />

                      <View style={styles.infoRow}>
                        <View style={styles.infoRowLeft}>
                          <Ionicons
                            name={vehicleRecord.licensing.status === 'valid' ? 'checkmark-circle' : 'warning'}
                            size={20}
                            color={getStatusColor(vehicleRecord.licensing.status)}
                          />
                          <Text style={styles.infoRowLabel}>Licenciamento</Text>
                        </View>
                        <Text style={[styles.infoRowValue, { color: getStatusColor(vehicleRecord.licensing.status) }]}>
                          {getStatusLabel(vehicleRecord.licensing.status)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.alertBox}>
                    <Ionicons name="information-circle" size={20} color="#0055FF" />
                    <Text style={styles.alertText}>
                      Mantenha todas as suas obrigações veiculares em dia para evitar multas e bloqueios.
                    </Text>
                  </View>
                </View>
              )}

              {/* Fines Tab */}
              {activeTab === 'fines' && (
                <View>
                  <Text style={styles.contentTitle}>
                    Multas de Trânsito ({vehicleRecord.fines.length})
                  </Text>
                  {vehicleRecord.fines.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Ionicons name="checkmark-circle" size={48} color="#4CAF50" />
                      <Text style={styles.emptyStateText}>Nenhuma multa registrada</Text>
                    </View>
                  ) : (
                    vehicleRecord.fines.map((fine: any) => (
                      <View key={fine.id} style={styles.fineCard}>
                        <View style={styles.fineCardHeader}>
                          <View>
                            <Text style={styles.fineType}>{fine.type}</Text>
                            <Text style={styles.fineDate}>{formatDate(fine.date)}</Text>
                            {fine.code && (
                              <Text style={styles.fineCode}>Código CTB: {fine.code}</Text>
                            )}
                          </View>
                          <View style={[styles.fineStatus, { backgroundColor: getStatusColor(fine.status) }]}>
                            <Ionicons name={getStatusIcon(fine.status)} size={14} color="#fff" />
                            <Text style={styles.fineStatusText}>{getStatusLabel(fine.status)}</Text>
                          </View>
                        </View>
                        <Text style={styles.fineDescription}>{fine.description}</Text>
                        <View style={styles.fineFooter}>
                          <Text style={styles.fineLocation}>
                            <Ionicons name="location" size={12} color="#666" /> {fine.location}
                          </Text>
                          <Text style={styles.fineValue}>{formatCurrency(fine.value)}</Text>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              )}

              {/* IPVA Tab */}
              {activeTab === 'ipva' && (
                <View>
                  <Text style={styles.contentTitle}>IPVA</Text>
                  {vehicleRecord.ipva.map((ipva: any) => (
                    <View key={ipva.year} style={styles.ipvaCard}>
                      <View style={styles.ipvaCardHeader}>
                        <Text style={styles.ipvaYear}>{ipva.year}</Text>
                        <View style={[styles.ipvaStatus, { backgroundColor: getStatusColor(ipva.status) }]}>
                          <Ionicons name={getStatusIcon(ipva.status)} size={14} color="#fff" />
                          <Text style={styles.ipvaStatusText}>{getStatusLabel(ipva.status)}</Text>
                        </View>
                      </View>
                      <View style={styles.ipvaDetails}>
                        <View style={styles.ipvaDetail}>
                          <Text style={styles.ipvaDetailLabel}>Valor</Text>
                          <Text style={styles.ipvaDetailValue}>{formatCurrency(ipva.value)}</Text>
                        </View>
                        <View style={styles.ipvaDetail}>
                          <Text style={styles.ipvaDetailLabel}>Vencimento</Text>
                          <Text style={styles.ipvaDetailValue}>{formatDate(ipva.dueDate)}</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Licensing Tab */}
              {activeTab === 'licensing' && (
                <View>
                  <Text style={styles.contentTitle}>Licenciamento</Text>
                  <View
                    style={[
                      styles.licensingCard,
                      vehicleRecord.licensing.status === 'expired' && styles.licensingCardExpired,
                      vehicleRecord.licensing.status === 'expiring' && styles.licensingCardExpiring,
                    ]}
                  >
                    <View style={styles.licensingHeader}>
                      <View>
                        <Text style={styles.licensingLabel}>Status</Text>
                        <Text
                          style={[
                            styles.licensingStatus,
                            { color: getStatusColor(vehicleRecord.licensing.status) },
                          ]}
                        >
                          {getStatusLabel(vehicleRecord.licensing.status)}
                        </Text>
                      </View>
                      <Ionicons
                        name={getStatusIcon(vehicleRecord.licensing.status)}
                        size={32}
                        color={getStatusColor(vehicleRecord.licensing.status)}
                      />
                    </View>

                    <View style={styles.licensingInfo}>
                      <View style={styles.licensingInfoItem}>
                        <Text style={styles.licensingInfoLabel}>Data de Vencimento</Text>
                        <Text style={styles.licensingInfoValue}>
                          {formatDate(vehicleRecord.licensing.expiryDate)}
                        </Text>
                      </View>

                      {vehicleRecord.licensing.status !== 'expired' && (
                        <View style={styles.licensingInfoItem}>
                          <Text style={styles.licensingInfoLabel}>Dias Restantes</Text>
                          <Text style={styles.licensingInfoValue}>
                            {vehicleRecord.licensing.daysUntilExpiry} dias
                          </Text>
                        </View>
                      )}
                    </View>

                    {vehicleRecord.licensing.status === 'expiring' && (
                      <View style={styles.licensingWarning}>
                        <Ionicons name="warning" size={16} color="#FFC107" />
                        <Text style={styles.licensingWarningText}>
                          Seu licenciamento vencerá em breve. Renove-o para evitar multas.
                        </Text>
                      </View>
                    )}

                    {vehicleRecord.licensing.status === 'expired' && (
                      <View style={styles.licensingWarning}>
                        <Ionicons name="close-circle" size={16} color="#FF5252" />
                        <Text style={styles.licensingWarningText}>
                          Seu licenciamento expirou. Renove-o imediatamente.
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.alertBox}>
                    <Ionicons name="information-circle" size={20} color="#0055FF" />
                    <Text style={styles.alertText}>
                      O licenciamento é obrigatório. Dirija com o documento sempre em dia.
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </>
        )}

        {!selectedVehicle && !isLoading && (
          <View style={styles.emptyState}>
            <Ionicons name="car-outline" size={64} color="#CCCCCC" />
            <Text style={styles.emptyStateText}>Selecione um veículo para começar</Text>
          </View>
        )}
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
    ...headerIconButton,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0055FF',
    textAlign: 'center',
    flex: 1,
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
  infoFootnote: {
    fontSize: 12,
    color: '#78909C',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 14,
  },
  sourceBannerIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  sourceBannerMock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 14,
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  sourceBannerMockText: {
    flex: 1,
    fontSize: 13,
    color: '#5D4037',
    lineHeight: 19,
  },
  sourceBannerApi: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 14,
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A5D6A7',
  },
  sourceBannerApiText: {
    flex: 1,
    fontSize: 13,
    color: '#1B5E20',
    lineHeight: 19,
  },
  sourceBannerHybrid: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 14,
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#90CAF9',
  },
  sourceBannerHybridText: {
    flex: 1,
    fontSize: 13,
    color: '#0D47A1',
    lineHeight: 19,
  },
  vehicleMetaCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E3F2FD',
  },
  vehicleMetaTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0055FF',
    marginBottom: 8,
  },
  vehicleMetaLine: {
    fontSize: 15,
    color: '#333',
    fontWeight: '600',
  },
  vehicleMetaSub: {
    fontSize: 12,
    color: '#78909C',
    marginTop: 4,
  },
  vehicleMetaFipe: {
    fontSize: 14,
    color: '#1565C0',
    fontWeight: '700',
    marginTop: 10,
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
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  summaryGrid: {
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  summaryCardWarning: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF5252',
  },
  summaryCardIcon: {
    marginBottom: 8,
  },
  summaryCardValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0055FF',
    marginBottom: 4,
  },
  summaryCardLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  summaryCardAmount: {
    fontSize: 12,
    color: '#FF5252',
    fontWeight: 'bold',
    marginTop: 4,
  },
  summaryCardStatus: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#0055FF',
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
  },
  tabLabelActive: {
    color: '#0055FF',
  },
  tabContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  contentSection: {
    marginBottom: 20,
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0055FF',
    marginBottom: 12,
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  infoRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoRowLabel: {
    fontSize: 14,
    color: '#333',
    marginLeft: 10,
    fontWeight: '500',
  },
  infoRowValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0055FF',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
  fineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  fineCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  fineType: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0055FF',
    marginBottom: 4,
  },
  fineDate: {
    fontSize: 12,
    color: '#999',
  },
  fineCode: {
    fontSize: 11,
    color: '#0055FF',
    marginTop: 4,
    fontFamily: 'monospace',
  },
  fineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  fineStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  fineDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  fineFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fineLocation: {
    fontSize: 12,
    color: '#666',
  },
  fineValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF5252',
  },
  ipvaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  ipvaCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  ipvaYear: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0055FF',
  },
  ipvaStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  ipvaStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  ipvaDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ipvaDetail: {
    flex: 1,
  },
  ipvaDetailLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  ipvaDetailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  licensingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  licensingCardExpired: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF5252',
  },
  licensingCardExpiring: {
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  licensingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  licensingLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  licensingStatus: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  licensingInfo: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  licensingInfoItem: {
    marginBottom: 12,
  },
  licensingInfoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  licensingInfoValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0055FF',
  },
  licensingWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  licensingWarningText: {
    flex: 1,
    fontSize: 13,
    color: '#E65100',
    fontWeight: '500',
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    gap: 12,
  },
  alertText: {
    flex: 1,
    fontSize: 13,
    color: '#0055FF',
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
});
