import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Pressable,
  Switch,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../navigation/types';
import { homeStyles } from './dashboardStyles';

const defaultServiceIds = ['ipva', 'insurance', 'fuel', 'battery', 'marketValue', 'driverLicense', 'payment', 'parkingTicket'] as const;
type ServiceId = (typeof defaultServiceIds)[number];
const favoritesStorageKey = '@dashboard_favorite_service_ids';

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const [locationEnabled, setLocationEnabled] = useState(false);

  const handleLocationToggle = async (value: boolean) => {
    if (value) {
      try {
        const { status } = await (await import('expo-location')).requestForegroundPermissionsAsync();
        if (status === 'granted') {
          setLocationEnabled(true);
        } else {
          setLocationEnabled(false);
        }
      } catch {
        setLocationEnabled(false);
      }
    } else {
      setLocationEnabled(false);
    }
  };

  const [selectedCity, setSelectedCity] = useState('Porto Alegre');
  const [showCityModal, setShowCityModal] = useState(false);
  const [favoriteServiceIds, setFavoriteServiceIds] = useState<ServiceId[]>([]);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  const cities = ['Porto Alegre', 'Canoas', 'Esteio'];

  const serviceMap: Record<
    ServiceId,
    { icon: string; title: string; subtitle: string; onPress: () => void; style: unknown; isParkingImage?: boolean }
  > = {
    ipva: {
      icon: 'document-text-outline',
      title: 'IPVA, MULTAS',
      subtitle: '& Licenciamento',
      onPress: () => navigation.navigate('IPVAAndFines'),
      style: homeStyles.serviceCard,
    },
    insurance: {
      icon: 'shield-checkmark-outline',
      title: 'SEGURO',
      subtitle: 'Cotação e contatos',
      onPress: () => navigation.navigate('Insurance'),
      style: homeStyles.serviceCard,
    },
    fuel: {
      icon: 'flash-outline',
      title: 'ABASTECER',
      subtitle: 'Combustível e elétrico',
      onPress: () => navigation.navigate('Fuel'),
      style: homeStyles.serviceCard,
    },
    battery: {
      icon: 'battery-charging-outline',
      title: 'Baterias Moura',
      subtitle: 'Entrega em 50 min',
      onPress: () => navigation.navigate('Battery'),
      style: homeStyles.serviceCard,
    },
    marketValue: {
      icon: 'trending-up-outline',
      title: 'VALOR',
      subtitle: 'de mercado',
      onPress: () => navigation.navigate('MarketValue'),
      style: homeStyles.serviceCard,
    },
    driverLicense: {
      icon: 'person-outline',
      title: 'CNH Protegida',
      subtitle: 'Maior controle',
      onPress: () => navigation.navigate('DriverLicense'),
      style: homeStyles.serviceCard,
    },
    payment: {
      icon: 'card-outline',
      title: 'Pagar Zona Azul',
      subtitle: '',
      onPress: () => navigation.navigate('Payment'),
      style: [homeStyles.serviceCard, homeStyles.smallCard, homeStyles.strongBlueCard],
    },
    parkingTicket: {
      icon: 'car-outline',
      title: 'Pagar Garagens',
      subtitle: '& ticket',
      onPress: () => navigation.navigate('ParkingTicket'),
      style: [homeStyles.serviceCard, homeStyles.smallCard, homeStyles.strongBlueCard],
      isParkingImage: true,
    },
  };

  const loadFavoriteServices = async () => {
    try {
      const raw = await AsyncStorage.getItem(favoritesStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter((id: string): id is ServiceId =>
            defaultServiceIds.includes(id as ServiceId)
          );
          setFavoriteServiceIds(filtered);
          return;
        }
      }
    } catch (error) {
      console.warn('Erro ao carregar favoritos do dashboard', error);
    }
    setFavoriteServiceIds([]);
  };

  const saveFavoriteServices = async (newFavorites: ServiceId[]) => {
    try {
      await AsyncStorage.setItem(favoritesStorageKey, JSON.stringify(newFavorites));
    } catch (error) {
      console.warn('Erro ao salvar favoritos do dashboard', error);
    }
  };

  const toggleFavoriteService = (serviceId: ServiceId) => {
    const nextFavorites = favoriteServiceIds.includes(serviceId)
      ? favoriteServiceIds.filter((id) => id !== serviceId)
      : [...favoriteServiceIds, serviceId];
    setFavoriteServiceIds(nextFavorites);
    saveFavoriteServices(nextFavorites);
  };

  const handleServicePress = (serviceId: ServiceId) => {
    serviceMap[serviceId].onPress();
  };

  React.useEffect(() => {
    loadFavoriteServices();
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const Location = await import('expo-location');
        const { status } = await Location.getForegroundPermissionsAsync();
        if (!cancelled && status === 'granted') {
          setLocationEnabled(true);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const openDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  return (
    <View style={homeStyles.container}>
      <StatusBar style="dark" />

      <View style={homeStyles.header}>
        <TouchableOpacity style={homeStyles.menuButton} onPress={openDrawer} accessibilityLabel="Abrir menu">
          <Ionicons name="menu" size={24} color="#0055FF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={homeStyles.locationContainer}
          onPress={() => setShowCityModal(true)}
          accessibilityRole="button"
          accessibilityLabel={`Cidade: ${selectedCity}. Toque para alterar.`}
        >
          <Text style={[homeStyles.locationText, { color: '#0055FF' }]}>{selectedCity}</Text>
          <Ionicons name="chevron-down" size={20} color="#0055FF" style={{ marginLeft: 4 }} />
        </TouchableOpacity>
        <View style={homeStyles.headerRightPlaceholder} />
      </View>

      <Pressable
        onPress={() => {
          void handleLocationToggle(!locationEnabled);
        }}
        style={({ pressed }) => [
          homeStyles.locationToggleRow,
          locationEnabled ? homeStyles.locationToggleRowActive : homeStyles.locationToggleRowInactive,
          pressed ? homeStyles.locationToggleRowPressed : null,
        ]}
        accessibilityRole="button"
        accessibilityLabel={
          locationEnabled ? 'Localização ativada. Toque para desativar.' : 'Localização desativada. Toque para ativar.'
        }
      >
        <View style={homeStyles.locationToggleLabelWrap}>
          <Ionicons
            name="location-outline"
            size={22}
            color={locationEnabled ? '#3DAA5C' : '#E8956A'}
          />
          <Text
            style={[
              homeStyles.locationToggleLabel,
              locationEnabled ? homeStyles.locationToggleLabelActive : homeStyles.locationToggleLabelInactive,
            ]}
          >
            {locationEnabled ? 'Localização ativada' : 'Localização desativada'}
          </Text>
        </View>
        <Switch
          value={locationEnabled}
          pointerEvents="none"
          trackColor={{ false: '#FFDCC4', true: '#B8E8C8' }}
          thumbColor={locationEnabled ? '#3DAA5C' : '#F0A068'}
          ios_backgroundColor={locationEnabled ? '#B8E8C8' : '#FFDCC4'}
        />
      </Pressable>

      <ScrollView style={homeStyles.scrollView} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={homeStyles.vehicleCard} onPress={() => navigation.navigate('AddVehicle', {})}>
          <Image
            source={require('../../assets/carro.png')}
            style={homeStyles.carroImage}
            resizeMode="contain"
          />
          <Text style={homeStyles.vehicleText}>Cadastre um veículo</Text>
          <View style={homeStyles.plusButton}>
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginHorizontal: 20,
            marginTop: 14,
            marginBottom: 10,
            gap: 14,
          }}
        >
          <Text style={{ flex: 1, color: '#333', fontWeight: 'bold', fontSize: 16 }}>Serviços</Text>
          <TouchableOpacity
            onPress={() => setShowOnlyFavorites((value) => !value)}
            style={homeStyles.filterChipToggle}
            accessibilityRole="button"
            accessibilityLabel={showOnlyFavorites ? 'Mostrar todos os serviços' : 'Mostrar apenas favoritos'}
          >
            {showOnlyFavorites ? (
              <>
                <Ionicons name="grid-outline" size={18} color="#0055FF" />
                <Text style={homeStyles.filterChipToggleText}>Mostrar todos</Text>
              </>
            ) : (
              <>
                <Ionicons name="star-outline" size={18} color="#0055FF" />
                <Text style={homeStyles.filterChipToggleText}>Mostrar favoritos</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={homeStyles.grid}>
          {(showOnlyFavorites
            ? defaultServiceIds.filter((id) => favoriteServiceIds.includes(id))
            : [...defaultServiceIds]
          ).map((serviceId) => {
            const service = serviceMap[serviceId];
            if (!service) return null;
            const cardStyle = service.style;

            const isCompactPaymentRow = serviceId === 'payment' || serviceId === 'parkingTicket';
            const iconWrapperStyle = isCompactPaymentRow
              ? homeStyles.smallCardIcon
              : service.isParkingImage
                ? homeStyles.smallCardIcon
                : homeStyles.serviceIcon;
            const iconSize = isCompactPaymentRow ? 20 : 24;

            const iconArea = service.isParkingImage ? (
              <Image
                source={require('../../assets/Garagem.png')}
                style={homeStyles.garagemImage}
                resizeMode="contain"
              />
            ) : (
              <Ionicons name={service.icon as 'document-text-outline'} size={iconSize} color="#0055FF" />
            );

            const isFavorite = favoriteServiceIds.includes(serviceId);

            return (
              <TouchableOpacity
                key={serviceId}
                style={cardStyle as object}
                onPress={() => handleServicePress(serviceId)}
              >
                <TouchableOpacity
                  style={homeStyles.serviceFavoriteButton}
                  onPress={(event) => {
                    event.stopPropagation();
                    toggleFavoriteService(serviceId);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                  hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                >
                  <Ionicons name={isFavorite ? 'star' : 'star-outline'} size={22} color={isFavorite ? '#FFD700' : '#0055FF'} />
                </TouchableOpacity>

                <View style={iconWrapperStyle}>{iconArea}</View>
                {isCompactPaymentRow ? (
                  <View style={homeStyles.smallCardTextWrap}>
                    <Text style={homeStyles.smallCardServiceText}>{service.title}</Text>
                    {service.subtitle ? (
                      <Text style={homeStyles.smallCardServiceSubtext}>{service.subtitle}</Text>
                    ) : null}
                  </View>
                ) : (
                  <>
                    <Text style={homeStyles.serviceText}>{service.title}</Text>
                    {service.subtitle ? <Text style={homeStyles.serviceSubtext}>{service.subtitle}</Text> : null}
                  </>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <Modal visible={showCityModal} transparent animationType="slide" onRequestClose={() => setShowCityModal(false)}>
        <View style={homeStyles.modalOverlay}>
          <View style={homeStyles.modalContent}>
            <View style={homeStyles.modalHeader}>
              <Text style={homeStyles.modalTitle}>Selecione a cidade</Text>
              <TouchableOpacity
                style={homeStyles.modalCloseButton}
                onPress={() => setShowCityModal(false)}
                accessibilityLabel="Fechar"
              >
                <Ionicons name="close" size={26} color="#0055FF" />
              </TouchableOpacity>
            </View>
            {cities.map((city) => (
              <TouchableOpacity
                key={city}
                style={homeStyles.modalItem}
                onPress={() => {
                  setSelectedCity(city);
                  setShowCityModal(false);
                }}
              >
                <Text style={homeStyles.modalItemText}>{city}</Text>
                {selectedCity === city ? <Ionicons name="checkmark" size={20} color="#0055FF" /> : null}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
};
