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
import { AuthProvider } from '../contexts/AuthContext';
import { useAuth } from '../hooks/useAuth';
import { Logo } from '../components/Logo/Logo';
import { AddVehicle, VehicleData } from '../pages/AddVehicle/AddVehicle';
import { Payment } from '../pages/Payment/Payment';

const ViewVehiclesScreen = ({ onBack, onAddVehicle, vehicles }: { onBack: () => void; onAddVehicle: () => void; vehicles: VehicleData[] }) => {

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
                <TouchableOpacity style={homeStyles.vehicleItemAction}>
                  <Ionicons name="chevron-forward" size={24} color="#0055FF" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const HomeScreen = ({ onLogout, onAddVehicle, onPayment, onViewVehicles }: { onLogout: () => void; onAddVehicle: () => void; onPayment: () => void; onViewVehicles: () => void }) => {
  const { user, logout } = useAuth();
  const [selectedCity, setSelectedCity] = useState('Porto Alegre');
  const [showCityModal, setShowCityModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-Dimensions.get('window').width * 0.8)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const cities = ['Porto Alegre', 'Canoas', 'Esteio'];

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
          <TouchableOpacity onPress={closeSidebar} style={homeStyles.sidebarCloseButton}>
            <Ionicons name="close" size={24} color="#0055FF" />
          </TouchableOpacity>
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

          <TouchableOpacity
            style={homeStyles.sidebarItem}
            onPress={() => {
              closeSidebar();
              onPayment();
            }}
          >
            <Ionicons name="card-outline" size={24} color="#0055FF" />
            <Text style={homeStyles.sidebarItemText}>Pagamentos</Text>
          </TouchableOpacity>

          <TouchableOpacity style={homeStyles.sidebarItem}>
            <Ionicons name="document-text-outline" size={24} color="#0055FF" />
            <Text style={homeStyles.sidebarItemText}>IPVA, Multas e Licenciamento</Text>
          </TouchableOpacity>

          <TouchableOpacity style={homeStyles.sidebarItem}>
            <Ionicons name="shield-checkmark-outline" size={24} color="#0055FF" />
            <Text style={homeStyles.sidebarItemText}>Seguro</Text>
          </TouchableOpacity>

          <TouchableOpacity style={homeStyles.sidebarItem}>
            <Ionicons name="settings-outline" size={24} color="#0055FF" />
            <Text style={homeStyles.sidebarItemText}>Configurações</Text>
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

        {/* Services Grid */}
        <View style={homeStyles.grid}>
          {/* Row 1 */}
          <TouchableOpacity style={homeStyles.serviceCard}>
            <View style={homeStyles.serviceIcon}>
              <Ionicons name="document-text-outline" size={24} color="#0055FF" />
            </View>
            <Text style={homeStyles.serviceText}>IPVA, MULTAS</Text>
            <Text style={homeStyles.serviceSubtext}>& Licenciamento</Text>
          </TouchableOpacity>

          <TouchableOpacity style={homeStyles.serviceCard}>
            <View style={homeStyles.serviceIcon}>
              <Ionicons name="shield-checkmark-outline" size={24} color="#0055FF" />
            </View>
            <Text style={homeStyles.serviceText}>SEGURO</Text>
            <Text style={homeStyles.serviceSubtext}>Cotação e contatos</Text>
          </TouchableOpacity>

          {/* Row 2 */}
          <TouchableOpacity style={homeStyles.serviceCard}>
            <View style={homeStyles.serviceIcon}>
              <Ionicons name="flash-outline" size={24} color="#0055FF" />
            </View>
            <Text style={homeStyles.serviceText}>ABASTECER</Text>
            <Text style={homeStyles.serviceSubtext}>Combustível e elétrico</Text>
          </TouchableOpacity>

          <TouchableOpacity style={homeStyles.serviceCard}>
            <View style={homeStyles.serviceIcon}>
              <Ionicons name="battery-charging-outline" size={24} color="#0055FF" />
            </View>
            <Text style={homeStyles.serviceText}>Baterias Moura</Text>
            <Text style={homeStyles.serviceSubtext}>Entrega em 50 min</Text>
          </TouchableOpacity>

          {/* Row 3 */}
          <TouchableOpacity style={homeStyles.serviceCard}>
            <View style={homeStyles.serviceIcon}>
              <Ionicons name="trending-up-outline" size={24} color="#0055FF" />
            </View>
            <Text style={homeStyles.serviceText}>VALOR</Text>
            <Text style={homeStyles.serviceSubtext}>de mercado</Text>
          </TouchableOpacity>

          <TouchableOpacity style={homeStyles.serviceCard}>
            <View style={homeStyles.serviceIcon}>
              <Ionicons name="person-outline" size={24} color="#0055FF" />
            </View>
            <Text style={homeStyles.serviceText}>CNH Protegida</Text>
            <Text style={homeStyles.serviceSubtext}>Maior controle</Text>
          </TouchableOpacity>

          {/* Row 4 - Pagar Zona Azul e Pagar Garagens */}
          <TouchableOpacity 
            style={[homeStyles.serviceCard, homeStyles.smallCard, homeStyles.strongBlueCard]}
            onPress={onPayment}
          >
            <View style={homeStyles.smallCardIcon}>
              <Text style={homeStyles.estacionarIconText}>E</Text>
            </View>
            <Text style={homeStyles.serviceText}>Pagar Zona Azul</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[homeStyles.serviceCard, homeStyles.smallCard, homeStyles.strongBlueCard]}>
            <View style={homeStyles.smallCardIcon}>
              <Image 
                source={require('../../assets/Garagem.png')} 
                style={homeStyles.garagemImage}
                resizeMode="contain"
              />
            </View>
            <View style={homeStyles.smallCardTextContainer}>
              <Text style={homeStyles.serviceText}>Pagar Garagens</Text>
              <Text style={homeStyles.serviceSubtext}>Pagar Tíquete</Text>
            </View>
          </TouchableOpacity>
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
  const [currentScreen, setCurrentScreen] = useState<'login' | 'register' | 'home' | 'addVehicle' | 'payment' | 'viewVehicles'>('login');

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
    setCurrentScreen('addVehicle');
  };

  const handleCancelAddVehicle = () => {
    setCurrentScreen('home');
  };

  const [vehicles, setVehicles] = useState<VehicleData[]>([]);

  const handleVehicleAdded = (vehicleData: VehicleData) => {
    // Salva o veículo no estado local (e aqui você pode também salvar no Firebase)
    setVehicles((prev) => [...prev, vehicleData]);
    console.log('Veículo adicionado:', vehicleData);
    Alert.alert('Sucesso', 'Veículo adicionado com sucesso!');
    setCurrentScreen('viewVehicles');
  };

  const handlePayment = () => {
    setCurrentScreen('payment');
  };

  const handleBackFromPayment = () => {
    setCurrentScreen('home');
  };

  const handleViewVehicles = () => {
    setCurrentScreen('viewVehicles');
  };

  const handleBackFromVehicles = () => {
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
    return (
      <AddVehicle
        onCancel={handleCancelAddVehicle}
        onAdd={handleVehicleAdded}
      />
    );
  }

  if (currentScreen === 'payment') {
    return <Payment onBack={handleBackFromPayment} />;
  }

  if (currentScreen === 'viewVehicles') {
    return <ViewVehiclesScreen onBack={handleBackFromVehicles} onAddVehicle={handleAddVehicle} vehicles={vehicles} />;
  }

  if (currentScreen === 'home' && user !== null) {
    return <HomeScreen onLogout={handleLogout} onAddVehicle={handleAddVehicle} onPayment={handlePayment} onViewVehicles={handleViewVehicles} />;
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
