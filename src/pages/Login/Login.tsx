import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Logo } from '../../components/Logo/Logo';
import { RootStackParamList } from '../../routes/types';
import { useAuth } from '../../hooks/useAuth';
import { getAuthLoginErrorMessage, getPasswordResetErrorMessage } from '../../utils/authErrorMessages';
import { compactIconButton } from '../../theme/touchTargets';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export const Login: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { login, sendPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSending, setResetSending] = useState(false);

  const handleLogin = async () => {
    setLoginError(null);
    if (!email || !password) {
      setLoginError('Por favor, preencha e-mail e senha.');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      navigation.replace('Main');
    } catch (error: unknown) {
      setLoginError(getAuthLoginErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const openForgotModal = () => {
    setResetEmail(email.trim());
    setForgotOpen(true);
  };

  const handleSendReset = async () => {
    const addr = resetEmail.trim();
    if (!addr) {
      Alert.alert('E-mail', 'Informe o e-mail da sua conta.');
      return;
    }
    setResetSending(true);
    try {
      await sendPasswordReset(addr);
      setForgotOpen(false);
      Alert.alert(
        'E-mail enviado',
        'Verifique sua caixa de entrada e a pasta de spam. Abra o link para definir uma nova senha.'
      );
    } catch (e: unknown) {
      Alert.alert('Não foi possível enviar', getPasswordResetErrorMessage(e));
    } finally {
      setResetSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.logoBlock}>
              <Logo showSubtitle={true} size="large" />
            </View>

            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Entrar</Text>
              <Text style={styles.formSubtitle}>Acesse sua conta para continuar</Text>

              {loginError != null && loginError !== '' ? (
                <View style={styles.loginErrorBanner}>
                  <Text style={styles.loginErrorText}>{loginError}</Text>
                </View>
              ) : null}

              <View style={styles.inputContainer}>
                <Text style={styles.label}>E-mail</Text>
                <TextInput
                  style={styles.input}
                  placeholder="seu@email.com"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={(t) => {
                    setEmail(t);
                    setLoginError(null);
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Senha</Text>
                <View style={styles.passwordField}>
                  <TextInput
                    style={styles.inputPassword}
                    placeholder="••••••••"
                    placeholderTextColor="#999"
                    value={password}
                    onChangeText={(t) => {
                      setPassword(t);
                      setLoginError(null);
                    }}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword((v) => !v)}
                    accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color="#888" />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                <Text style={styles.buttonText}>{isLoading ? 'Entrando...' : 'Entrar'}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.forgotRow} onPress={openForgotModal} activeOpacity={0.7}>
                <Text style={styles.forgotText}>Esqueci minha senha</Text>
              </TouchableOpacity>

              <View style={styles.footerDivider} />

              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => navigation.navigate('Register')}
                activeOpacity={0.7}
              >
                <Text style={styles.linkText}>
                  Não tem conta? <Text style={styles.linkTextBold}>Registre-se</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        <Modal visible={forgotOpen} transparent animationType="fade" onRequestClose={() => setForgotOpen(false)}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalCenter}>
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>Recuperar senha</Text>
                <Text style={styles.modalHint}>
                  Enviaremos um link para o e-mail cadastrado (serviço gratuito do Firebase).
                </Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="seu@email.com"
                  placeholderTextColor="#999"
                  value={resetEmail}
                  onChangeText={setResetEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.modalBtnGhost} onPress={() => setForgotOpen(false)} disabled={resetSending}>
                    <Text style={styles.modalBtnGhostText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalBtnPrimary, resetSending && styles.buttonDisabled]}
                    onPress={() => void handleSendReset()}
                    disabled={resetSending}
                  >
                    {resetSending ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.buttonText}>Enviar</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const SCREEN_BG = 'rgb(215, 239, 253)';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: SCREEN_BG,
  },
  container: {
    flex: 1,
    backgroundColor: SCREEN_BG,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    justifyContent: 'center',
  },
  logoBlock: {
    alignItems: 'center',
    marginBottom: 8,
  },
  formCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 22,
    paddingVertical: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginBottom: 6,
    textAlign: 'center',
  },
  formSubtitle: {
    fontSize: 15,
    color: '#666',
    marginBottom: 22,
    textAlign: 'center',
    lineHeight: 22,
  },
  loginErrorBanner: {
    backgroundColor: '#FFEBEE',
    borderRadius: 10,
    padding: 12,
    marginBottom: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#FFCDD2',
  },
  loginErrorText: {
    color: '#C62828',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'left',
  },
  inputContainer: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#FFFFFF',
  },
  passwordField: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  inputPassword: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
  },
  eyeButton: {
    ...compactIconButton,
    paddingHorizontal: 8,
  },
  button: {
    backgroundColor: '#0055FF',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
    shadowColor: '#0055FF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  forgotRow: {
    marginTop: 14,
    alignItems: 'center',
    paddingVertical: 4,
  },
  forgotText: {
    fontSize: 15,
    color: '#0055FF',
    fontWeight: '600',
  },
  footerDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E0E8EF',
    marginTop: 20,
    marginBottom: 4,
  },
  linkButton: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCenter: {
    flex: 1,
    justifyContent: 'center',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  modalHint: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#FFFFFF',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 18,
    alignItems: 'center',
  },
  modalBtnGhost: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  modalBtnGhostText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  modalBtnPrimary: {
    backgroundColor: '#0055FF',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    minWidth: 100,
    alignItems: 'center',
  },
  linkText: {
    color: '#666',
    fontSize: 15,
  },
  linkTextBold: {
    color: '#0055FF',
    fontWeight: '700',
  },
});
