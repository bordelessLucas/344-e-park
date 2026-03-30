import GasStationsMap from '../../components/GasStationsMap';
      {/* Mapa dos postos próximos */}
      {userLocation && nearbyStations.length > 0 && (
        <GasStationsMap userLocation={userLocation} stations={nearbyStations} />
      )}
// ...existing code...
// Estado para armazenar os postos encontrados pela API
const [nearbyStations, setNearbyStations] = useState<any[]>([]);

// Buscar postos próximos quando a localização do usuário estiver disponível
useEffect(() => {
  if (userLocation) {
    fetchNearbyGasStations(userLocation.lat, userLocation.lng, 5000).then(setNearbyStations);
  }
}, [userLocation]);
// ...existing code...
// Estado para localização do usuário
const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

useEffect(() => {
  (async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      alert('Permissão de localização negada.');
      return;
    }
    let location = await Location.getCurrentPositionAsync({});
    setUserLocation({ lat: location.coords.latitude, lng: location.coords.longitude });
  })();
}, []);
import React, { useState, useEffect } from 'react';
import * as Location from 'expo-location';
// Substitua pela sua chave da API do Google Places
const GOOGLE_PLACES_API_KEY = 'SUA_CHAVE_GOOGLE_PLACES';

// Função utilitária para buscar postos próximos usando Google Places API
async function fetchNearbyGasStations(lat: number, lng: number, radius: number = 5000) {
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=gas_station&key=${GOOGLE_PLACES_API_KEY}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.status === 'OK') {
      return data.results;
    } else {
      return [];
    }
  } catch (error) {
    return [];
  }
}
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Linking,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { FuelStation, StationType } from '../../types/fuelStation';
import { FUEL_STATIONS, getStationsByCity, getStationsByType } from '../../services/fuelStationService';

interface FuelStationsProps {
  onBack: () => void;
}

const { width } = Dimensions.get('window');

export const FuelStations: React.FC<FuelStationsProps> = ({ onBack }) => {
  const [selectedCity, setSelectedCity] = useState<'Porto Alegre' | 'Canoas' | 'Esteio'>('Porto Alegre');
  const [selectedType, setSelectedType] = useState<StationType>('all');
  const [showCityModal, setShowCityModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [selectedStation, setSelectedStation] = useState<FuelStation | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const cities: Array<'Porto Alegre' | 'Canoas' | 'Esteio'> = ['Porto Alegre', 'Canoas', 'Esteio'];

  const getFilteredStations = (): FuelStation[] => {
    let stations = getStationsByCity(selectedCity);
    
    if (selectedType === 'gas') {
      stations = stations.filter(s => s.type === 'gas' || s.type === 'both');
    } else if (selectedType === 'electric') {
      stations = stations.filter(s => s.type === 'electric' || s.type === 'both');
    }
    
    return stations;
  };

  const openInMaps = (station: FuelStation) => {
    const { lat, lng } = station.coordinates;
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    Linking.openURL(url).catch(() => {
      alert('Não foi possível abrir o mapa');
    });
  };

  const callStation = (phone: string) => {
    Linking.openURL(`tel:${phone}`).catch(() => {
      alert('Não foi possível fazer a ligação');
    });
  };

  const getTypeIcon = (type: FuelStation['type']): any => {
    switch (type) {
      case 'gas':
        return 'water-outline';
      case 'electric':
        return 'flash-outline';
      case 'both':
        return 'apps-outline';
      default:
        return 'location-outline';
    }
  };

  const getTypeLabel = (type: FuelStation['type']): string => {
    switch (type) {
      case 'gas':
        return 'Combustível';
      case 'electric':
        return 'Elétrico';
      case 'both':
        return 'Combustível + Elétrico';
      default:
        return '';
    }
  };

  const getTypeColor = (type: FuelStation['type']): string => {
    switch (type) {
      case 'gas':
        return '#FF9800';
      case 'electric':
        return '#4CAF50';
      case 'both':
        return '#2196F3';
      default:
        return '#666';
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
        <Text style={styles.headerTitle}>Abastecer</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <View style={styles.infoIcon}>
          <Ionicons name="flash-outline" size={32} color="#0055FF" />
        </View>
        <Text style={styles.infoTitle}>Postos de Combustível e Carregamento</Text>
        <Text style={styles.infoText}>
          Encontre postos de gasolina e pontos de carregamento elétrico próximos a você.
        </Text>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        {/* City Filter */}
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowCityModal(true)}
        >
          <Ionicons name="location" size={20} color="#0055FF" />
          <Text style={styles.filterText}>{selectedCity}</Text>
          <Ionicons name="chevron-down" size={16} color="#666" />
        </TouchableOpacity>

        {/* Type Filter */}
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowTypeModal(true)}
        >
          <Ionicons name="options" size={20} color="#0055FF" />
          <Text style={styles.filterText}>
            {selectedType === 'all' ? 'Todos' : selectedType === 'gas' ? 'Combustível' : 'Elétrico'}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Stations List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Text style={styles.resultsText}>
          {getFilteredStations().length} {getFilteredStations().length === 1 ? 'local encontrado' : 'locais encontrados'}
        </Text>

        {getFilteredStations().map((station) => (
          <TouchableOpacity
            key={station.id}
            style={styles.stationCard}
            onPress={() => {
              setSelectedStation(station);
              setShowDetailsModal(true);
            }}
          >
            <View style={styles.stationHeader}>
              <View style={styles.stationHeaderLeft}>
                <View style={[styles.typeIcon, { backgroundColor: getTypeColor(station.type) + '20' }]}>
                  <Ionicons name={getTypeIcon(station.type)} size={24} color={getTypeColor(station.type)} />
                </View>
                <View style={styles.stationHeaderInfo}>
                  <Text style={styles.stationName}>{station.name}</Text>
                  {station.brand && <Text style={styles.stationBrand}>{station.brand}</Text>}
                </View>
              </View>
              <View style={[styles.typeBadge, { backgroundColor: getTypeColor(station.type) + '20' }]}>
                <Text style={[styles.typeBadgeText, { color: getTypeColor(station.type) }]}>
                  {getTypeLabel(station.type)}
                </Text>
              </View>
            </View>

            <View style={styles.stationInfo}>
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={16} color="#666" />
                <Text style={styles.infoText2}>{station.address}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="business-outline" size={16} color="#666" />
                <Text style={styles.infoText2}>{station.neighborhood}</Text>
              </View>
              {station.hours && (
                <View style={styles.infoRow}>
                  <Ionicons name="time-outline" size={16} color="#666" />
                  <Text style={styles.infoText2}>{station.hours}</Text>
                </View>
              )}
            </View>

            {/* Prices */}
            {station.prices && (
              <View style={styles.pricesContainer}>
                {station.prices.gasoline && (
                  <View style={styles.priceItem}>
                    <Text style={styles.priceLabel}>Gasolina</Text>
                    <Text style={styles.priceValue}>R$ {station.prices.gasoline.toFixed(2)}</Text>
                  </View>
                )}
                {station.prices.ethanol && (
                  <View style={styles.priceItem}>
                    <Text style={styles.priceLabel}>Etanol</Text>
                    <Text style={styles.priceValue}>R$ {station.prices.ethanol.toFixed(2)}</Text>
                  </View>
                )}
                {station.prices.diesel && (
                  <View style={styles.priceItem}>
                    <Text style={styles.priceLabel}>Diesel</Text>
                    <Text style={styles.priceValue}>R$ {station.prices.diesel.toFixed(2)}</Text>
                  </View>
                )}
                {station.prices.charging && (
                  <View style={styles.priceItem}>
                    <Text style={styles.priceLabel}>kWh</Text>
                    <Text style={styles.priceValue}>R$ {station.prices.charging.toFixed(2)}</Text>
                  </View>
                )}
              </View>
            )}

            <TouchableOpacity
              style={styles.mapButton}
              onPress={() => openInMaps(station)}
            >
              <Ionicons name="navigate" size={16} color="#0055FF" />
              <Text style={styles.mapButtonText}>Ver no Mapa</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}

        {getFilteredStations().length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={64} color="#CCC" />
            <Text style={styles.emptyTitle}>Nenhum local encontrado</Text>
            <Text style={styles.emptyText}>
              Tente alterar os filtros de busca
            </Text>
          </View>
        )}
      </ScrollView>

      {/* City Selection Modal */}
      <Modal
        visible={showCityModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCityModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecione a Cidade</Text>
              <TouchableOpacity onPress={() => setShowCityModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            {cities.map((city) => (
              <TouchableOpacity
                key={city}
                style={styles.modalOption}
                onPress={() => {
                  setSelectedCity(city);
                  setShowCityModal(false);
                }}
              >
                <Text style={styles.modalOptionText}>{city}</Text>
                {selectedCity === city && (
                  <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Type Selection Modal */}
      <Modal
        visible={showTypeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tipo de Abastecimento</Text>
              <TouchableOpacity onPress={() => setShowTypeModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            {(['all', 'gas', 'electric'] as StationType[]).map((type) => (
              <TouchableOpacity
                key={type}
                style={styles.modalOption}
                onPress={() => {
                  setSelectedType(type);
                  setShowTypeModal(false);
                }}
              >
                <Text style={styles.modalOptionText}>
                  {type === 'all' ? 'Todos' : type === 'gas' ? 'Combustível' : 'Elétrico'}
                </Text>
                {selectedType === type && (
                  <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Station Details Modal */}
      <Modal
        visible={showDetailsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailsModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalhes</Text>
              <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            {selectedStation && (
              <ScrollView style={styles.detailsScroll}>
                <View style={styles.detailsHeader}>
                  <Text style={styles.detailsName}>{selectedStation.name}</Text>
                  <View style={[styles.typeBadge, { backgroundColor: getTypeColor(selectedStation.type) + '20' }]}>
                    <Text style={[styles.typeBadgeText, { color: getTypeColor(selectedStation.type) }]}>
                      {getTypeLabel(selectedStation.type)}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Endereço</Text>
                  <Text style={styles.detailText}>{selectedStation.address}</Text>
                  <Text style={styles.detailText}>{selectedStation.neighborhood}, {selectedStation.city}</Text>
                </View>

                {selectedStation.hours && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Horário</Text>
                    <Text style={styles.detailText}>{selectedStation.hours}</Text>
                  </View>
                )}

                {selectedStation.services && selectedStation.services.length > 0 && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Serviços</Text>
                    {selectedStation.services.map((service, idx) => (
                      <View key={idx} style={styles.serviceItem}>
                        <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                        <Text style={styles.serviceText}>{service}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {selectedStation.chargingPower && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Carregamento</Text>
                    <Text style={styles.detailText}>Potência: {selectedStation.chargingPower}</Text>
                    {selectedStation.chargingPlugs && (
                      <Text style={styles.detailText}>
                        Conectores: {selectedStation.chargingPlugs.join(', ')}
                      </Text>
                    )}
                  </View>
                )}

                {selectedStation.prices && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Preços</Text>
                    <View style={styles.pricesGrid}>
                      {selectedStation.prices.gasoline && (
                        <View style={styles.priceDetailItem}>
                          <Text style={styles.priceDetailLabel}>Gasolina</Text>
                          <Text style={styles.priceDetailValue}>R$ {selectedStation.prices.gasoline.toFixed(2)}/L</Text>
                        </View>
                      )}
                      {selectedStation.prices.ethanol && (
                        <View style={styles.priceDetailItem}>
                          <Text style={styles.priceDetailLabel}>Etanol</Text>
                          <Text style={styles.priceDetailValue}>R$ {selectedStation.prices.ethanol.toFixed(2)}/L</Text>
                        </View>
                      )}
                      {selectedStation.prices.diesel && (
                        <View style={styles.priceDetailItem}>
                          <Text style={styles.priceDetailLabel}>Diesel</Text>
                          <Text style={styles.priceDetailValue}>R$ {selectedStation.prices.diesel.toFixed(2)}/L</Text>
                        </View>
                      )}
                      {selectedStation.prices.charging && (
                        <View style={styles.priceDetailItem}>
                          <Text style={styles.priceDetailLabel}>Elétrico</Text>
                          <Text style={styles.priceDetailValue}>R$ {selectedStation.prices.charging.toFixed(2)}/kWh</Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.navigateButton}
                  onPress={() => openInMaps(selectedStation)}
                >
                  <Ionicons name="navigate" size={20} color="#FFF" />
                  <Text style={styles.navigateButtonText}>Abrir no Google Maps</Text>
                </TouchableOpacity>

                {selectedStation.phone && (
                  <TouchableOpacity
                    style={styles.callButton}
                    onPress={() => callStation(selectedStation.phone!)}
                  >
                    <Ionicons name="call" size={20} color="#0055FF" />
                    <Text style={styles.callButtonText}>Ligar: {selectedStation.phone}</Text>
                  </TouchableOpacity>
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
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  filterText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  resultsText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  stationCard: {
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
  stationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stationHeaderLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stationHeaderInfo: {
    flex: 1,
  },
  stationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  stationBrand: {
    fontSize: 13,
    color: '#0055FF',
    fontWeight: '500',
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  stationInfo: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText2: {
    fontSize: 13,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  pricesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  priceItem: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  priceLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 2,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3F2FD',
    paddingVertical: 10,
    borderRadius: 8,
  },
  mapButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0055FF',
    marginLeft: 6,
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
    maxHeight: '50%',
    paddingBottom: 20,
  },
  detailsModal: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
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
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333',
  },
  detailsScroll: {
    padding: 20,
  },
  detailsHeader: {
    marginBottom: 20,
  },
  detailsName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  serviceText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  pricesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  priceDetailItem: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: '45%',
  },
  priceDetailLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  priceDetailValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0055FF',
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 12,
  },
  navigateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginLeft: 8,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3F2FD',
    paddingVertical: 14,
    borderRadius: 8,
  },
  callButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0055FF',
    marginLeft: 8,
  },
});
