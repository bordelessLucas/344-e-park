import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider } from '../contexts/AuthContext';
import { useAuth } from '../hooks/useAuth';
import { Logo } from '../components/Logo/Logo';
import { AddVehicle, VehicleData } from '../pages/AddVehicle/AddVehicle';
import { Payment } from '../pages/Payment/Payment';

const HomeScreen = ({ onLogout, onAddVehicle, onPayment }: { onLogout: () => void; onAddVehicle: () => void; onPayment: () => void }) => {
  const { user, logout } = useAuth();
  const [selectedCity, setSelectedCity] = useState('Porto Alegre');
  const [showCityModal, setShowCityModal] = useState(false);

  const cities = ['Porto Alegre', 'Canoas', 'Esteio'];

  const handleLogout = async () => {
    try {
      await logout();
      onLogout();
    } catch (error: any) {
      Alert.alert('Erro', 'Erro ao fazer logout');
    }
  };

  return (
    <View style={homeStyles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={homeStyles.header}>
        <TouchableOpacity style={homeStyles.menuButton}>
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
  const [currentScreen, setCurrentScreen] = useState<'login' | 'register' | 'home' | 'addVehicle' | 'payment'>('login');

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

  const handleVehicleAdded = (vehicleData: VehicleData) => {
    // Aqui você pode salvar o veículo no Firebase ou fazer o que precisar
    console.log('Veículo adicionado:', vehicleData);
    Alert.alert('Sucesso', 'Veículo adicionado com sucesso!');
    setCurrentScreen('home');
  };

  const handlePayment = () => {
    setCurrentScreen('payment');
  };

  const handleBackFromPayment = () => {
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

  if (currentScreen === 'home' && user !== null) {
    return <HomeScreen onLogout={handleLogout} onAddVehicle={handleAddVehicle} onPayment={handlePayment} />;
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
});

export default App;
