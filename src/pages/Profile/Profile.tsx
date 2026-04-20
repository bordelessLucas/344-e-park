import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { headerIconButton } from '../../theme/touchTargets';
import { getParkingHistory } from '../../services/parkingHistoryService';
import { getUserProfile } from '../../services/userProfileService';
import type { ParkingHistoryEntry } from '../../types/parkingHistory';
import { getChangePasswordErrorMessage } from '../../utils/authErrorMessages';

export interface ProfileProps {
  onBack: () => void;
  onViewVehicles: () => void;
  onPaymentSettings: () => void;
  onAddress: () => void;
  onLoggedOut: () => void | Promise<void>;
  vehicleCount: number;
}

export const Profile: React.FC<ProfileProps> = ({
  onBack,
  onViewVehicles,
  onPaymentSettings,
  onAddress,
  onLoggedOut,
  vehicleCount,
}) => {
  const { user, updateProfilePhoto, changePassword } = useAuth();
  const [photoUploading, setPhotoUploading] = useState(false);
  const [parkingHistory, setParkingHistory] = useState<ParkingHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [cpfMasked, setCpfMasked] = useState<string | null>(null);
  const [pwdOpen, setPwdOpen] = useState(false);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdBusy, setPwdBusy] = useState(false);

  const refreshProfileData = useCallback(async () => {
    if (!user?.uid) {
      setParkingHistory([]);
      setCpfMasked(null);
      setHistoryLoading(false);
      return;
    }
    setHistoryLoading(true);
    try {
      const [hist, prof] = await Promise.all([getParkingHistory(user.uid), getUserProfile(user.uid)]);
      setParkingHistory(hist);
      const d = prof?.cpfDigits?.replace(/\D/g, '') ?? '';
      if (d.length === 11) {
        setCpfMasked(`***.***.***-${d.slice(9)}`);
      } else {
        setCpfMasked(null);
      }
    } catch {
      setParkingHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [user?.uid]);

  useFocusEffect(
    useCallback(() => {
      void refreshProfileData();
    }, [refreshProfileData])
  );

  const handlePickProfilePhoto = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'Permissão necessária',
          'Precisamos acessar suas fotos para definir a imagem de perfil.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (result.canceled || !result.assets[0]) {
        return;
      }

      setPhotoUploading(true);
      try {
        await updateProfilePhoto(result.assets[0].uri);
      } catch {
        Alert.alert('Erro', 'Não foi possível enviar a foto. Verifique sua conexão e tente novamente.');
      } finally {
        setPhotoUploading(false);
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível abrir a galeria.');
    }
  };

  const handleLogout = () => {
    Alert.alert('Sair', 'Deseja sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await onLoggedOut();
            } catch {
              Alert.alert('Erro', 'Não foi possível sair. Tente novamente.');
            }
          })();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0055FF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Perfil</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <TouchableOpacity
            style={styles.avatarLarge}
            onPress={handlePickProfilePhoto}
            disabled={photoUploading}
            activeOpacity={0.85}
            accessibilityLabel="Alterar foto de perfil"
          >
            {user?.photoURL ? (
              <Image source={{ uri: user.photoURL }} style={styles.avatarImage} resizeMode="cover" />
            ) : (
              <Ionicons name="person" size={48} color="#0055FF" />
            )}
            {photoUploading ? (
              <View style={styles.avatarLoading}>
                <ActivityIndicator size="large" color="#0055FF" />
              </View>
            ) : null}
          </TouchableOpacity>
          <Text style={styles.avatarHint}>Toque na foto para alterar</Text>
          <Text style={styles.displayName}>{user?.displayName || 'Usuário'}</Text>
          <Text style={styles.email}>{user?.email || ''}</Text>
          {cpfMasked ? <Text style={styles.cpfLine}>CPF: {cpfMasked}</Text> : null}
        </View>

        <Text style={styles.sectionLabel}>Zona Azul</Text>

        <View style={styles.historyCard}>
          <Text style={styles.historyTitle}>Histórico de estacionamento</Text>
          <Text style={styles.historyHint}>
            Registros simulados após pagamento de ticket (sem cobrança real até você ativar o gateway).
          </Text>
          {historyLoading ? (
            <ActivityIndicator style={styles.historySpinner} color="#0055FF" />
          ) : parkingHistory.length === 0 ? (
            <Text style={styles.historyEmpty}>Nenhum registro ainda. Pague um ticket na área Zona Azul.</Text>
          ) : (
            parkingHistory.slice(0, 8).map((h, idx) => (
              <View key={h.id} style={[styles.historyRow, idx === 0 && styles.historyRowFirst]}>
                <View style={styles.historyRowTop}>
                  <Text style={styles.historyPlate}>{h.vehiclePlate}</Text>
                  <Text style={styles.historyValue}>R$ {h.value.toFixed(2)}</Text>
                </View>
                <Text style={styles.historyMeta} numberOfLines={2}>
                  {h.location} · {h.ticketNumber}
                </Text>
                <Text style={styles.historyDate}>
                  {new Date(h.createdAt).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            ))
          )}
        </View>

        <Text style={styles.sectionLabel}>Conta</Text>

        <TouchableOpacity
          style={styles.row}
          onPress={() => {
            setCurrentPwd('');
            setNewPwd('');
            setConfirmPwd('');
            setPwdOpen(true);
          }}
          activeOpacity={0.7}
        >
          <View style={styles.rowIcon}>
            <Ionicons name="key-outline" size={22} color="#0055FF" />
          </View>
          <View style={styles.rowBody}>
            <Text style={styles.rowTitle}>Alterar senha</Text>
            <Text style={styles.rowSubtitle}>Senha atual e nova senha</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.row} onPress={onViewVehicles} activeOpacity={0.7}>
          <View style={styles.rowIcon}>
            <Ionicons name="car-outline" size={22} color="#0055FF" />
          </View>
          <View style={styles.rowBody}>
            <Text style={styles.rowTitle}>Meus veículos</Text>
            <Text style={styles.rowSubtitle}>
              {vehicleCount === 0
                ? 'Nenhum veículo cadastrado'
                : `${vehicleCount} ${vehicleCount === 1 ? 'veículo' : 'veículos'}`}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.row} onPress={onPaymentSettings} activeOpacity={0.7}>
          <View style={styles.rowIcon}>
            <Ionicons name="card-outline" size={22} color="#0055FF" />
          </View>
          <View style={styles.rowBody}>
            <Text style={styles.rowTitle}>Formas de pagamento</Text>
            <Text style={styles.rowSubtitle}>Cartões e PIX cadastrados</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.row} onPress={onAddress} activeOpacity={0.7}>
          <View style={styles.rowIcon}>
            <Ionicons name="home-outline" size={22} color="#0055FF" />
          </View>
          <View style={styles.rowBody}>
            <Text style={styles.rowTitle}>Endereço</Text>
            <Text style={styles.rowSubtitle}>Cadastrar ou editar endereço</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.row, styles.logoutRow]} onPress={handleLogout} activeOpacity={0.7}>
          <View style={[styles.rowIcon, styles.logoutIconWrap]}>
            <Ionicons name="log-out-outline" size={22} color="#F0A068" />
          </View>
          <View style={styles.rowBody}>
            <Text style={styles.logoutText}>Sair da conta</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#F0A068" />
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={pwdOpen} transparent animationType="fade" onRequestClose={() => setPwdOpen(false)}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalCardPwd}>
            <Text style={styles.modalTitlePwd}>Alterar senha</Text>
            <Text style={styles.modalHintPwd}>Informe a senha atual e a nova senha.</Text>
            <Text style={styles.pwdLabel}>Senha atual</Text>
            <TextInput
              style={styles.pwdInput}
              secureTextEntry
              value={currentPwd}
              onChangeText={setCurrentPwd}
              placeholder="••••••••"
              placeholderTextColor="#999"
              autoCapitalize="none"
            />
            <Text style={styles.pwdLabel}>Nova senha</Text>
            <TextInput
              style={styles.pwdInput}
              secureTextEntry
              value={newPwd}
              onChangeText={setNewPwd}
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor="#999"
              autoCapitalize="none"
            />
            <Text style={styles.pwdLabel}>Confirmar nova senha</Text>
            <TextInput
              style={styles.pwdInput}
              secureTextEntry
              value={confirmPwd}
              onChangeText={setConfirmPwd}
              placeholder="Repita a nova senha"
              placeholderTextColor="#999"
              autoCapitalize="none"
            />
            <View style={styles.modalRowPwd}>
              <TouchableOpacity style={styles.modalBtnGhostPwd} onPress={() => setPwdOpen(false)} disabled={pwdBusy}>
                <Text style={styles.modalBtnGhostTextPwd}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtnPrimaryPwd, pwdBusy && styles.pwdBtnDisabled]}
                disabled={pwdBusy}
                onPress={() => {
                  void (async () => {
                    if (!newPwd || newPwd.length < 6) {
                      Alert.alert('Senha', 'A nova senha deve ter pelo menos 6 caracteres.');
                      return;
                    }
                    if (newPwd !== confirmPwd) {
                      Alert.alert('Senha', 'A confirmação não confere.');
                      return;
                    }
                    setPwdBusy(true);
                    try {
                      await changePassword(currentPwd, newPwd);
                      setPwdOpen(false);
                      Alert.alert('Senha alterada', 'Use a nova senha no próximo login.');
                    } catch (e) {
                      Alert.alert('Erro', getChangePasswordErrorMessage(e));
                    } finally {
                      setPwdBusy(false);
                    }
                  })();
                }}
              >
                {pwdBusy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonTextPwd}>Salvar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
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
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  headerPlaceholder: {
    width: 32,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 20,
  },
  heroCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarLarge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarLoading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarHint: {
    fontSize: 13,
    color: '#888',
    marginBottom: 12,
  },
  displayName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
  },
  email: {
    fontSize: 15,
    color: '#666',
    marginTop: 6,
    textAlign: 'center',
  },
  cpfLine: {
    fontSize: 14,
    color: '#555',
    marginTop: 8,
    textAlign: 'center',
  },
  historyCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  historyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#333',
    marginBottom: 6,
  },
  historyHint: {
    fontSize: 12,
    color: '#888',
    marginBottom: 12,
    lineHeight: 17,
  },
  historySpinner: {
    marginVertical: 16,
  },
  historyEmpty: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  historyRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E0E0E0',
    paddingTop: 12,
    marginTop: 12,
  },
  historyRowFirst: {
    borderTopWidth: 0,
    paddingTop: 0,
    marginTop: 0,
  },
  historyRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyPlate: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0055FF',
  },
  historyValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  historyMeta: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  historyDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rowBody: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  rowSubtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  logoutRow: {
    marginTop: 8,
    marginBottom: 32,
  },
  logoutIconWrap: {
    backgroundColor: '#FFDCC4',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F0A068',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCardPwd: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  modalTitlePwd: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 6,
  },
  modalHintPwd: {
    fontSize: 13,
    color: '#666',
    marginBottom: 14,
  },
  pwdLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0055FF',
    marginBottom: 6,
  },
  pwdInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#FAFAFA',
  },
  modalRowPwd: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 8,
    gap: 12,
  },
  modalBtnGhostPwd: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  modalBtnGhostTextPwd: {
    fontSize: 16,
    color: '#666',
  },
  modalBtnPrimaryPwd: {
    backgroundColor: '#0055FF',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 22,
    minWidth: 100,
    alignItems: 'center',
  },
  buttonTextPwd: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  pwdBtnDisabled: {
    opacity: 0.6,
  },
});
