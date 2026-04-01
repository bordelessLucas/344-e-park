import React, { useState, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider } from '../contexts/AuthContext';
import { useAuth } from '../hooks/useAuth';
import { Logo } from '../components/Logo/Logo';
import { AddVehicle, VehicleData } from '../pages/AddVehicle/AddVehicle';
import { Payment } from '../pages/Payment/Payment';
import { MarketValue } from '../pages/MarketValue/MarketValue';
import { Insurance } from '../pages/Insurance/Insurance';
import { IPVAAndFines } from '../pages/IPVAAndFines/IPVAAndFines';
import { DriverLicensePage } from '../pages/DriverLicense/DriverLicense';
import { BatteryService } from '../pages/BatteryService/BatteryService';
import { FuelStations } from '../pages/FuelStations/FuelStations';
import { ParkingTicketPage } from '../pages/ParkingTicket/ParkingTicket';
import { PaymentSettings } from '../pages/PaymentSettings/PaymentSettings';

const ViewVehiclesScreen = ({ onBack, onAddVehicle, onEditVehicle, vehicles }: { onBack: () => void; onAddVehicle: () => void; onEditVehicle: (index: number) => void; vehicles: VehicleData[] }) => {

  return (
    <View style={homeStyles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={homeStyles.header}>
        <TouchableOpacity style={homeStyles.menuButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#0055FF" />
        </TouchableOpacity>
        <Text style={[homeStyles.locationText, { color: '#0055FF', fontSize: 20, fontWeight: 'bold' }]}>
          Meus Veículos
        </Text>
        <TouchableOpacity style={homeStyles.shareButton} onPress={onAddVehicle}>
          <Ionicons name="add" size={24} color="#0055FF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={homeStyles.scrollView} showsVerticalScrollIndicator={false}>
        {vehicles.length === 0 ? (
          <View style={homeStyles.emptyContainer}>
            <Ionicons name="car-outline" size={80} color="#CCCCCC" />
            <Text style={homeStyles.emptyText}>Nenhum veículo cadastrado</Text>
            <Text style={homeStyles.emptySubtext}>Toque no botão + para adicionar um veículo</Text>
            <TouchableOpacity
              style={homeStyles.addButton}
              onPress={onAddVehicle}
            >
              <Ionicons name="add" size={24} color="#FFFFFF" />
              <Text style={homeStyles.addButtonText}>Adicionar Veículo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={homeStyles.vehiclesList}>
            {vehicles.map((vehicle, index) => (
              <View key={index} style={homeStyles.vehicleItem}>
                <View style={homeStyles.vehicleItemContent}>
                  <View style={homeStyles.vehicleItemHeader}>
                    <Text style={homeStyles.vehicleItemPlaca}>{vehicle.placa}</Text>
                    <Text style={homeStyles.vehicleItemTipo}>{vehicle.tipo}</Text>
                  </View>
                  <Text style={homeStyles.vehicleItemModelo}>{vehicle.modelo}</Text>
                  <Text style={homeStyles.vehicleItemAno}>Ano: {vehicle.ano}</Text>
                  {vehicle.possuiSeguro && (
                    <View>
                      <View style={homeStyles.vehicleItemBadge}>
                        <Ionicons name="shield-checkmark" size={16} color="#4CAF50" />
                        <Text style={homeStyles.vehicleItemBadgeText}>Com Seguro</Text>
                      </View>
                      {vehicle.insurance && (
                        <View style={{ marginTop: 8 }}>
                          <Text style={homeStyles.vehicleItemInsurance}>Seguradora: {vehicle.insurance.company}</Text>
                          <Text style={homeStyles.vehicleItemInsurance}>Apolice: {vehicle.insurance.policyNumber}</Text>
                          <Text style={homeStyles.vehicleItemInsurance}>Validade: {vehicle.insurance.validUntil}</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  style={homeStyles.vehicleItemAction}
                  onPress={() => onEditVehicle(index)}
                >
                  <Ionicons name="create-outline" size={24} color="#0055FF" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const HomeScreen = ({ onLogout, onAddVehicle, onPayment, onViewVehicles, onMarketValue, onInsurance, onIPVAAndFines, onDriverLicense, onBattery, onFuel, onParkingTicket, onPaymentSettings }: { onLogout: () => void; onAddVehicle: () => void; onPayment: () => void; onViewVehicles: () => void; onMarketValue: () => void; onInsurance: () => void; onIPVAAndFines: () => void; onDriverLicense: () => void; onBattery: () => void; onFuel: () => void; onParkingTicket: () => void; onPaymentSettings: () => void }) => {
    const [locationStatus, setLocationStatus] = useState<string>('');

    const handleEnableLocation = async () => {
      try {
        const { status } = await (await import('expo-location')).requestForegroundPermissionsAsync();
        if (status === 'granted') {
          setLocationStatus('Localização ativada!');
        } else {
          setLocationStatus('Permissão de localização negada.');
        }
      } catch (e) {
        setLocationStatus('Erro ao ativar localização.');
      }
    };
        {/* Botão para ativar localização */}
        <TouchableOpacity style={{
          backgroundColor: '#0055FF',
          padding: 12,
          borderRadius: 8,
          margin: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
        }} onPress={handleEnableLocation}>
          <Ionicons name="location-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Ativar Localização</Text>
        </TouchableOpacity>
        {!!locationStatus && (
          <Text style={{ color: '#0055FF', textAlign: 'center', marginBottom: 8 }}>{locationStatus}</Text>
        )}
  const { user, logout } = useAuth();
  const [selectedCity, setSelectedCity] = useState('Porto Alegre');
  const [showCityModal, setShowCityModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orderedServiceIds, setOrderedServiceIds] = useState<ServiceId[]>([]);
  const [favoriteServiceIds, setFavoriteServiceIds] = useState<ServiceId[]>([]);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const slideAnim = useRef(new Animated.Value(-Dimensions.get('window').width * 0.8)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const cities = ['Porto Alegre', 'Canoas', 'Esteio'];

  const defaultServiceIds = ['ipva', 'insurance', 'fuel', 'battery', 'marketValue', 'driverLicense', 'payment', 'parkingTicket'] as const;
  type ServiceId = (typeof defaultServiceIds)[number];
  const storageKey = '@dashboard_last_service_order';
  const favoritesStorageKey = '@dashboard_favorite_service_ids';

  const serviceMap: Record<ServiceId, { icon: string; title: string; subtitle: string; onPress: () => void; style: any; isParkingImage?: boolean }> = {
    ipva: {
      icon: 'document-text-outline',
      title: 'IPVA, MULTAS',
      subtitle: '& Licenciamento',
      onPress: onIPVAAndFines,
      style: homeStyles.serviceCard,
    },
    insurance: {
      icon: 'shield-checkmark-outline',
      title: 'SEGURO',
      subtitle: 'Cotação e contatos',
      onPress: onInsurance,
      style: homeStyles.serviceCard,
    },
    fuel: {
      icon: 'flash-outline',
      title: 'ABASTECER',
      subtitle: 'Combustível e elétrico',
      onPress: onFuel,
      style: homeStyles.serviceCard,
    },
    battery: {
      icon: 'battery-charging-outline',
      title: 'Baterias Moura',
      subtitle: 'Entrega em 50 min',
      onPress: onBattery,
      style: homeStyles.serviceCard,
    },
    marketValue: {
      icon: 'trending-up-outline',
      title: 'VALOR',
      subtitle: 'de mercado',
      onPress: onMarketValue,
      style: homeStyles.serviceCard,
    },
    driverLicense: {
      icon: 'person-outline',
      title: 'CNH Protegida',
      subtitle: 'Maior controle',
      onPress: onDriverLicense,
      style: homeStyles.serviceCard,
    },
    payment: {
      icon: 'card-outline',
      title: 'Pagar Zona Azul',
      subtitle: '',
      onPress: onPayment,
      style: [homeStyles.serviceCard, homeStyles.smallCard, homeStyles.strongBlueCard],
    },
    parkingTicket: {
      icon: 'car-outline',
      title: 'Pagar Garagens',
      subtitle: 'Pagar Tíquete',
      onPress: onParkingTicket,
      style: [homeStyles.serviceCard, homeStyles.smallCard, homeStyles.strongBlueCard],
      isParkingImage: true,
    },
  };
  const toggleSidebar = () => {
    if (sidebarOpen) {
      // Fechar sidebar
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -Dimensions.get('window').width * 0.8,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => setSidebarOpen(false));
    } else {
      // Abrir sidebar
      setSidebarOpen(true);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const loadServiceOrder = async () => {
    try {
      const raw = await AsyncStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const filtered = parsed.filter((id: string): id is ServiceId => defaultServiceIds.includes(id as ServiceId));
          const merged: ServiceId[] = [...filtered, ...defaultServiceIds.filter((id) => !filtered.includes(id))];
          setOrderedServiceIds(merged);
          return;
        }
      }
    } catch (error) {
      console.warn('Erro ao carregar ordem do dashboard', error);
    }
    setOrderedServiceIds([...defaultServiceIds]);
  };

  const saveServiceOrder = async (newOrder: ServiceId[]) => {
    try {
      await AsyncStorage.setItem(storageKey, JSON.stringify(newOrder));
    } catch (error) {
      console.warn('Erro ao salvar ordem do dashboard', error);
    }
  };

  const loadFavoriteServices = async () => {
    try {
      const raw = await AsyncStorage.getItem(favoritesStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter((id: string): id is ServiceId => defaultServiceIds.includes(id as ServiceId));
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
      : [serviceId, ...favoriteServiceIds];
    setFavoriteServiceIds(nextFavorites);
    saveFavoriteServices(nextFavorites);
  };

  const handleServicePress = (serviceId: ServiceId) => {
    const service = serviceMap[serviceId];

    const nextOrder: ServiceId[] = [serviceId, ...orderedServiceIds.filter((id) => id !== serviceId)];
    setOrderedServiceIds(nextOrder);
    saveServiceOrder(nextOrder);

    service.onPress();
  };

  React.useEffect(() => {
    loadServiceOrder();
    loadFavoriteServices();
  }, []);


  const closeSidebar = () => {
    if (sidebarOpen) {
      toggleSidebar();
    }
  };

  const handleLogout = async () => {
    try {
      closeSidebar();
      await logout();
      onLogout();
    } catch (error: any) {
      Alert.alert('Erro', 'Erro ao fazer logout');
    }
  };

  return (
    <View style={homeStyles.container}>
      <StatusBar style="dark" />
      
      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <Animated.View
          style={[
            homeStyles.overlay,
            {
              opacity: overlayOpacity,
            },
          ]}
        >
          <TouchableOpacity
            style={homeStyles.overlayTouchable}
            activeOpacity={1}
            onPress={closeSidebar}
          />
        </Animated.View>
      )}

      {/* Sidebar */}
      <Animated.View
        style={[
          homeStyles.sidebar,
          {
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        {/* Botão de fechar destacado no topo da sidebar */}
        <TouchableOpacity
          onPress={closeSidebar}
          style={{
            alignSelf: 'flex-end',
            margin: 16,
            backgroundColor: '#0055FF',
            borderRadius: 20,
            padding: 8,
            elevation: 4,
            zIndex: 10,
          }}
        >
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
        <View style={homeStyles.sidebarHeader}>
          <View style={homeStyles.sidebarUserInfo}>
            <View style={homeStyles.sidebarAvatar}>
              <Ionicons name="person" size={32} color="#0055FF" />
            </View>
            <View style={homeStyles.sidebarUserDetails}>
              <Text style={homeStyles.sidebarUserName}>
                {user?.displayName || 'Usuário'}
              </Text>
              <Text style={homeStyles.sidebarUserEmail}>
                {user?.email || ''}
              </Text>
            </View>
          </View>
        </View>

        <ScrollView style={homeStyles.sidebarContent}>
          <TouchableOpacity
            style={homeStyles.sidebarItem}
            onPress={() => {
              closeSidebar();
              onViewVehicles();
            }}
          >
            <Ionicons name="car-outline" size={24} color="#0055FF" />
            <Text style={homeStyles.sidebarItemText}>Meus Veículos</Text>
          </TouchableOpacity>

          {/* Sidebar services ordenados por uso */}
          {((orderedServiceIds.length ? orderedServiceIds : defaultServiceIds) as ServiceId[])
            .filter((id) => ['payment', 'ipva', 'insurance'].includes(id))
            .map((serviceId) => {
              const service = serviceMap[serviceId];
              if (!service) return null;

              const labelMap: Record<ServiceId, string> = {
                ipva: 'IPVA, Multas e Licenciamento',
                insurance: 'Seguro',
                fuel: 'Abastecer',
                battery: 'Baterias Moura',
                marketValue: 'Valor de Mercado',
                driverLicense: 'CNH Protegida',
                payment: 'Pagamentos',
                parkingTicket: 'Pagar Garagens',
              };
              const iconMap: Record<ServiceId, string> = {
                ipva: 'document-text-outline',
                insurance: 'shield-checkmark-outline',
                fuel: 'flash-outline',
                battery: 'battery-charging-outline',
                marketValue: 'trending-up-outline',
                driverLicense: 'person-outline',
                payment: 'card-outline',
                parkingTicket: 'car-outline',
              };

              return (
                <TouchableOpacity
                  key={`sidebar-${serviceId}`}
                  style={homeStyles.sidebarItem}
                  onPress={() => {
                    closeSidebar();
                    handleServicePress(serviceId);
                  }}
                >
                  <Ionicons name={iconMap[serviceId] as any} size={24} color="#0055FF" />
                  <Text style={homeStyles.sidebarItemText}>{labelMap[serviceId]}</Text>
                </TouchableOpacity>
              );
            })}

          <TouchableOpacity
            style={homeStyles.sidebarItem}
            onPress={() => {
              closeSidebar();
              onPaymentSettings();
            }}
          >
            <Ionicons name="settings-outline" size={24} color="#0055FF" />
            <Text style={homeStyles.sidebarItemText}>Configurações de pagamento</Text>
          </TouchableOpacity>

          <TouchableOpacity style={homeStyles.sidebarItem}>
            <Ionicons name="help-circle-outline" size={24} color="#0055FF" />
            <Text style={homeStyles.sidebarItemText}>Ajuda</Text>
          </TouchableOpacity>

          <TouchableOpacity style={homeStyles.sidebarItem}>
            <Ionicons name="information-circle-outline" size={24} color="#0055FF" />
            <Text style={homeStyles.sidebarItemText}>Sobre</Text>
          </TouchableOpacity>
        </ScrollView>

        <TouchableOpacity
          style={homeStyles.sidebarLogout}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
          <Text style={homeStyles.sidebarLogoutText}>Sair</Text>
        </TouchableOpacity>
      </Animated.View>
      
      {/* Header */}
      <View style={homeStyles.header}>
        <TouchableOpacity style={homeStyles.menuButton} onPress={toggleSidebar}>
          <Ionicons name="menu" size={24} color="#0055FF" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={homeStyles.locationContainer}
          onPress={() => setShowCityModal(true)}
        >
          <Text style={[homeStyles.locationText, { color: '#0055FF' }]}>{selectedCity}</Text>
          <Ionicons name="chevron-down" size={20} color="#0055FF" style={{ marginLeft: 4 }} />
        </TouchableOpacity>
        <TouchableOpacity style={homeStyles.shareButton}>
          <Ionicons name="share-outline" size={24} color="#0055FF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={homeStyles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Vehicle Registration Section */}
        <TouchableOpacity 
          style={homeStyles.vehicleCard}
          onPress={onAddVehicle}
        >
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

        {/* Serviços */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 16, marginTop: 8 }}>
          <Text style={{ color: '#333', fontWeight: 'bold', fontSize: 16 }}>Serviços</Text>
          <TouchableOpacity
            onPress={() => setShowOnlyFavorites((value) => !value)}
            style={{
              backgroundColor: showOnlyFavorites ? '#0055FF' : '#F3F3F3',
              paddingVertical: 6,
              paddingHorizontal: 10,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: '#CCC',
            }}
          >
            <Text style={{ color: showOnlyFavorites ? '#FFF' : '#333', fontSize: 13 }}>
              {showOnlyFavorites ? 'Mostrando só favoritos' : 'Mostrar favoritos'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={homeStyles.grid}>
          {(() => {
            const baseOrder: ServiceId[] = orderedServiceIds.length ? orderedServiceIds : [...defaultServiceIds];
            const merged = Array.from(new Set([...favoriteServiceIds.filter((id) => baseOrder.includes(id)), ...baseOrder]));
            return showOnlyFavorites ? merged.filter((id) => favoriteServiceIds.includes(id)) : merged;
          })().map((serviceId) => {
            const service = serviceMap[serviceId];
            if (!service) return null;
            const cardStyle = service.style;

            const iconArea = service.isParkingImage ? (
              <Image
                source={require('../../assets/Garagem.png')}
                style={homeStyles.garagemImage}
                resizeMode="contain"
              />
            ) : (
              <Ionicons name={service.icon as any} size={24} color="#0055FF" />
            );

            const isFavorite = favoriteServiceIds.includes(serviceId);

            return (
              <TouchableOpacity
                key={serviceId}
                style={cardStyle}
                onPress={() => handleServicePress(serviceId)}
              >
                <TouchableOpacity
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    zIndex: 9,
                    backgroundColor: 'rgba(255,255,255,0.85)',
                    borderRadius: 12,
                    padding: 4,
                  }}
                  onPress={(event) => {
                    event.stopPropagation();
                    toggleFavoriteService(serviceId);
                  }}
                >
                  <Ionicons name={isFavorite ? 'star' : 'star-outline'} size={18} color={isFavorite ? '#FFD700' : '#0055FF'} />
                </TouchableOpacity>

                <View style={service.isParkingImage ? homeStyles.smallCardIcon : homeStyles.serviceIcon}>
                  {iconArea}
                </View>
                <Text style={homeStyles.serviceText}>{service.title}</Text>
                {service.subtitle ? <Text style={homeStyles.serviceSubtext}>{service.subtitle}</Text> : null}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* City Selection Modal */}
      <Modal
        visible={showCityModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCityModal(false)}
      >
        <View style={homeStyles.modalOverlay}>
          <View style={homeStyles.modalContent}>
            <View style={homeStyles.modalHeader}>
              <Text style={homeStyles.modalTitle}>Selecione a cidade</Text>
              <TouchableOpacity onPress={() => setShowCityModal(false)}>
                <Ionicons name="close" size={24} color="#0055FF" />
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
                {selectedCity === city && (
                  <Ionicons name="checkmark" size={20} color="#0055FF" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const LoginScreen = ({ onLogin, onRegister }: { onLogin: () => void; onRegister: () => void }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      onLogin();
    } catch (error: any) {
      Alert.alert('Erro', error?.message || 'Erro ao fazer login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <Logo showSubtitle={true} size="large" />

          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Entrar</Text>
            <Text style={styles.formSubtitle}>Acesse sua conta para continuar</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="seu@email.com"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Senha</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={true}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, isLoading === true && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading === true}
            >
              <Text style={styles.buttonText}>{isLoading === true ? 'Entrando...' : 'Entrar'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkButton} onPress={onRegister}>
              <Text style={styles.linkText}>
                Não tem conta? <Text style={styles.linkTextBold}>Registre-se</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const RegisterScreen = ({ onLogin, onRegister }: { onLogin: () => void; onRegister: () => void }) => {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setIsLoading(true);
    try {
      await register(email, password, name);
      onLogin();
    } catch (error: any) {
      Alert.alert('Erro', error?.message || 'Erro ao registrar. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <Logo showSubtitle={true} size="large" />

          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Criar Conta</Text>
            <Text style={styles.formSubtitle}>Preencha os dados para se registrar</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Nome Completo</Text>
              <TextInput
                style={styles.input}
                placeholder="Seu nome"
                placeholderTextColor="#999"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="seu@email.com"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Senha</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={true}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirmar Senha</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#999"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={true}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, isLoading === true && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={isLoading === true}
            >
              <Text style={styles.buttonText}>{isLoading === true ? 'Registrando...' : 'Registrar'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkButton} onPress={onRegister}>
              <Text style={styles.linkText}>
                Já tem conta? <Text style={styles.linkTextBold}>Faça login</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const AppContent = () => {
  const { user, loading } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<'login' | 'register' | 'home' | 'addVehicle' | 'payment' | 'paymentSettings' | 'viewVehicles' | 'marketValue' | 'insurance' | 'ipvaAndFines' | 'driverLicense' | 'battery' | 'fuel' | 'parkingTicket'>('login');
  const [vehicles, setVehicles] = useState<VehicleData[]>([]);
  const [editingVehicleIndex, setEditingVehicleIndex] = useState<number | null>(null);

  React.useEffect(() => {
    if (loading === false) {
      if (user !== null) {
        setCurrentScreen('home');
      } else {
        setCurrentScreen('login');
      }
    }
  }, [user, loading]);

  const handleLogin = () => {
    setCurrentScreen('home');
  };

  const handleLogout = () => {
    setCurrentScreen('login');
  };

  const handleGoToRegister = () => {
    setCurrentScreen('register');
  };

  const handleGoToLogin = () => {
    setCurrentScreen('login');
  };

  const handleAddVehicle = () => {
    setEditingVehicleIndex(null);
    setCurrentScreen('addVehicle');
  };

  const handleCancelAddVehicle = () => {
    if (editingVehicleIndex !== null) {
      setCurrentScreen('viewVehicles');
      return;
    }
    setCurrentScreen('home');
  };

  const handleVehicleAdded = (vehicleData: VehicleData) => {
    if (editingVehicleIndex !== null) {
      setVehicles((prev) =>
        prev.map((vehicle, index) => (index === editingVehicleIndex ? vehicleData : vehicle))
      );
      setEditingVehicleIndex(null);
      Alert.alert('Sucesso', 'Veículo atualizado com sucesso!');
      setCurrentScreen('viewVehicles');
      return;
    }

    // Salva o veículo no estado local (e aqui você pode também salvar no Firebase)
    setVehicles((prev) => [...prev, vehicleData]);
    console.log('Veículo adicionado:', vehicleData);
    Alert.alert('Sucesso', 'Veículo adicionado com sucesso!');
    setCurrentScreen('viewVehicles');
  };

  const handleEditVehicle = (index: number) => {
    setEditingVehicleIndex(index);
    setCurrentScreen('addVehicle');
  };

  const handlePayment = () => {
    setCurrentScreen('payment');
  };

  const handleBackFromPayment = () => {
    setCurrentScreen('home');
  };

  const handlePaymentSettings = () => {
    setCurrentScreen('paymentSettings');
  };

  const handleBackFromPaymentSettings = () => {
    setCurrentScreen('home');
  };

  const handleViewVehicles = () => {
    setCurrentScreen('viewVehicles');
  };

  const handleBackFromVehicles = () => {
    setCurrentScreen('home');
  };

  const handleMarketValue = () => {
    setCurrentScreen('marketValue');
  };

  const handleBackFromMarketValue = () => {
    setCurrentScreen('home');
  };

  const handleInsurance = () => {
    setCurrentScreen('insurance');
  };

  const handleBackFromInsurance = () => {
    setCurrentScreen('home');
  };

  const handleIPVAAndFines = () => {
    setCurrentScreen('ipvaAndFines');
  };

  const handleBackFromIPVAAndFines = () => {
    setCurrentScreen('home');
  };

  const handleDriverLicense = () => {
    setCurrentScreen('driverLicense');
  };

  const handleBackFromDriverLicense = () => {
    setCurrentScreen('home');
  };

  const handleBattery = () => {
    setCurrentScreen('battery');
  };

  const handleBackFromBattery = () => {
    setCurrentScreen('home');
  };

  const handleFuel = () => {
    setCurrentScreen('fuel');
  };

  const handleBackFromFuel = () => {
    setCurrentScreen('home');
  };

  const handleParkingTicket = () => {
    setCurrentScreen('parkingTicket');
  };

  const handleBackFromParkingTicket = () => {
    setCurrentScreen('home');
  };

  if (loading === true) {
    return (
      <View style={styles.container}>
        <Text>Carregando...</Text>
      </View>
    );
  }

  if (currentScreen === 'addVehicle') {
    const vehicleToEdit = editingVehicleIndex !== null ? vehicles[editingVehicleIndex] : null;
    return (
      <AddVehicle
        onCancel={handleCancelAddVehicle}
        onAdd={handleVehicleAdded}
        initialVehicle={vehicleToEdit}
        title={editingVehicleIndex !== null ? 'Editar veículo' : 'Adicionar veículo'}
        submitLabel={editingVehicleIndex !== null ? 'Salvar alterações' : 'Adicionar'}
      />
    );
  }

  if (currentScreen === 'payment') {
    return <Payment onBack={handleBackFromPayment} />;
  }

  if (currentScreen === 'paymentSettings') {
    return <PaymentSettings onBack={handleBackFromPaymentSettings} />;
  }

  if (currentScreen === 'viewVehicles') {
    return <ViewVehiclesScreen onBack={handleBackFromVehicles} onAddVehicle={handleAddVehicle} onEditVehicle={handleEditVehicle} vehicles={vehicles} />;
  }

  if (currentScreen === 'marketValue') {
    return <MarketValue onBack={handleBackFromMarketValue} vehicles={vehicles} />;
  }

  if (currentScreen === 'insurance') {
    return <Insurance onBack={handleBackFromInsurance} vehicles={vehicles} />;
  }

  if (currentScreen === 'ipvaAndFines') {
    return <IPVAAndFines onBack={handleBackFromIPVAAndFines} vehicles={vehicles} />;
  }

  if (currentScreen === 'driverLicense') {
    return <DriverLicensePage onBack={handleBackFromDriverLicense} />;
  }

  if (currentScreen === 'battery') {
    return <BatteryService onBack={handleBackFromBattery} vehicles={vehicles} />;
  }

  if (currentScreen === 'fuel') {
    return <FuelStations onBack={handleBackFromFuel} />;
  }

  if (currentScreen === 'parkingTicket') {
    return <ParkingTicketPage onBack={handleBackFromParkingTicket} />;
  }

  if (currentScreen === 'home' && user !== null) {
    return <HomeScreen onLogout={handleLogout} onAddVehicle={handleAddVehicle} onPayment={handlePayment} onViewVehicles={handleViewVehicles} onMarketValue={handleMarketValue} onInsurance={handleInsurance} onIPVAAndFines={handleIPVAAndFines} onDriverLicense={handleDriverLicense} onBattery={handleBattery} onFuel={handleFuel} onParkingTicket={handleParkingTicket} onPaymentSettings={handlePaymentSettings} />;
  }

  if (currentScreen === 'register') {
    return <RegisterScreen onLogin={handleLogin} onRegister={handleGoToLogin} />;
  }

  return <LoginScreen onLogin={handleLogin} onRegister={handleGoToRegister} />;
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
      <StatusBar style="auto" />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  formContainer: {
    width: '100%',
  },
  formTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0055FF',
    marginBottom: 8,
    textAlign: 'center',
  },
  formSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0055FF',
    marginBottom: 8,
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
  button: {
    backgroundColor: '#0055FF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  linkText: {
    color: '#666',
    fontSize: 15,
  },
  linkTextBold: {
    color: '#0055FF',
    fontWeight: 'bold',
  },
});

const homeStyles = StyleSheet.create({
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
  menuButton: {
    padding: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  shareButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(199, 199, 199, 0.38)',
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
  },
  vehicleText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#0055FF',
    marginLeft: 12,
  },
  plusButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4A9EFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingBottom: 20,
    justifyContent: 'space-between',
  },
  serviceCard: {
    width: '47%',
    backgroundColor: '#4A9EFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minHeight: 140,
    justifyContent: 'center',
    marginBottom: 12,
  },
  smallCard: {
    width: '47%',
    minHeight: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  strongBlueCard: {
    backgroundColor: '#0055FF',
  },
  smallCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 0,
  },
  estaparImage: {
    width: 20,
    height: 20,
  },
  estacionarIconText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0055FF',
  },
  garagemImage: {
    width: 20,
    height: 20,
  },
  carroImage: {
    width: 70,
    height: 70,
  },
  smallCardTextContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceIconText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  serviceText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgb(255, 255, 255)',
    textAlign: 'center',
    marginTop: 4,
  },
  serviceSubtext: {
    fontSize: 12,
    color: 'rgb(255, 255, 255)',
    textAlign: 'center',
    marginTop: 2,
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
    maxHeight: '50%',
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
    borderBottomColor: '#E0E0E0',
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
  },
  // Sidebar Styles
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 998,
  },
  overlayTouchable: {
    flex: 1,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: Dimensions.get('window').width * 0.8,
    backgroundColor: '#FFFFFF',
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: 'rgb(215, 239, 253)',
  },
  sidebarUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sidebarAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sidebarUserDetails: {
    flex: 1,
  },
  sidebarUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0055FF',
    marginBottom: 4,
  },
  sidebarUserEmail: {
    fontSize: 12,
    color: '#666',
  },
  sidebarCloseButton: {
    padding: 8,
  },
  sidebarContent: {
    flex: 1,
    paddingTop: 10,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sidebarItemText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 16,
  },
  sidebarLogout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#0055FF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
  },
  sidebarLogoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  // View Vehicles Screen Styles
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0055FF',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 30,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  vehiclesList: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  vehicleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  vehicleItemContent: {
    flex: 1,
  },
  vehicleItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  vehicleItemPlaca: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0055FF',
  },
  vehicleItemTipo: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  vehicleItemModelo: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  vehicleItemInsurance: {
    fontSize: 13,
    color: '#555',
  },
  vehicleItemAno: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  vehicleItemBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  vehicleItemBadgeText: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 4,
    fontWeight: '600',
  },
  vehicleItemAction: {
    padding: 8,
  },
});

export default App;
