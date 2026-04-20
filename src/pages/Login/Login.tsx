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

            {loginError != null && loginError !== '' ? (
              <View style={styles.loginErrorBanner}>
                <Text style={styles.loginErrorText}>{loginError}</Text>
              </View>
            ) : null}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
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
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.button, isLoading && styles.buttonDisabled]} 
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>{isLoading ? 'Entrando...' : 'Entrar'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.forgotRow} onPress={openForgotModal} activeOpacity={0.7}>
              <Text style={styles.forgotText}>Esqueci minha senha</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => navigation.navigate('Register')}
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
                style={styles.input}
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
  );
};

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
    marginBottom: 12,
    textAlign: 'center',
  },
  loginErrorBanner: {
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  loginErrorText: {
    color: '#C62828',
    fontSize: 14,
    lineHeight: 20,
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
  passwordField: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    backgroundColor: '#FAFAFA',
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
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#0055FF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  forgotRow: {
    marginTop: 16,
    alignItems: 'center',
  },
  forgotText: {
    fontSize: 15,
    color: '#0055FF',
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 16,
    alignItems: 'center',
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
  },
  modalTitle: {
    fontSize: 20,
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
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
    alignItems: 'center',
  },
  modalBtnGhost: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  modalBtnGhostText: {
    fontSize: 16,
    color: '#666',
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
    fontWeight: 'bold',
  },
});
