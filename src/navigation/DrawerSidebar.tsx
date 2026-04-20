import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Alert } from 'react-native';
import { DrawerContentScrollView, type DrawerContentComponentProps } from '@react-navigation/drawer';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../hooks/useAuth';
import { signOutAndGoToLogin } from './navigationRef';
import { homeStyles } from '../screens/dashboardStyles';
import type { MainStackParamList } from './types';

const defaultServiceIds = ['ipva', 'insurance', 'fuel', 'battery', 'marketValue', 'driverLicense', 'payment', 'parkingTicket'] as const;
type ServiceId = (typeof defaultServiceIds)[number];
const storageKey = '@dashboard_last_service_order';

type IonName = React.ComponentProps<typeof Ionicons>['name'];

function SidebarNavRow({
  icon,
  label,
  onPress,
  iconColor = '#0055FF',
}: {
  icon: IonName;
  label: string;
  onPress: () => void;
  iconColor?: string;
}) {
  return (
    <TouchableOpacity style={homeStyles.sidebarNavCard} onPress={onPress} activeOpacity={0.72}>
      <View style={homeStyles.sidebarNavIconWrap}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <Text style={homeStyles.sidebarNavCardText} numberOfLines={2}>
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={18} color="#B0BEC5" />
    </TouchableOpacity>
  );
}

export function DrawerSidebar(props: DrawerContentComponentProps) {
  const { navigation } = props;
  const { user } = useAuth();
  const [orderedServiceIds, setOrderedServiceIds] = useState<ServiceId[]>([]);

  React.useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const filtered = parsed.filter((id: string): id is ServiceId =>
              defaultServiceIds.includes(id as ServiceId)
            );
            const merged: ServiceId[] = [...filtered, ...defaultServiceIds.filter((id) => !filtered.includes(id))];
            setOrderedServiceIds(merged);
            return;
          }
        }
      } catch {
        /* ignore */
      }
      setOrderedServiceIds([...defaultServiceIds]);
    })();
  }, []);

  const goToStack = (screen: keyof MainStackParamList) => {
    navigation.closeDrawer();
    navigation.navigate('Root', { screen: screen as never });
  };

  const handleServicePress = (serviceId: ServiceId) => {
    const nextOrder: ServiceId[] = [serviceId, ...orderedServiceIds.filter((id) => id !== serviceId)];
    setOrderedServiceIds(nextOrder);
    AsyncStorage.setItem(storageKey, JSON.stringify(nextOrder)).catch(() => {});

    navigation.closeDrawer();
    const map: Record<ServiceId, keyof MainStackParamList> = {
      ipva: 'IPVAAndFines',
      insurance: 'Insurance',
      fuel: 'Fuel',
      battery: 'Battery',
      marketValue: 'MarketValue',
      driverLicense: 'DriverLicense',
      payment: 'Payment',
      parkingTicket: 'ParkingTicket',
    };
    navigation.navigate('Root', { screen: map[serviceId] as never });
  };

  const handleLogout = () => {
    Alert.alert('Sair', 'Deseja sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          try {
            navigation.closeDrawer();
            await signOutAndGoToLogin();
          } catch {
            Alert.alert('Erro', 'Não foi possível sair. Tente novamente.');
          }
        },
      },
    ]);
  };

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

  const iconMap: Record<ServiceId, IonName> = {
    ipva: 'document-text-outline',
    insurance: 'shield-checkmark-outline',
    fuel: 'flash-outline',
    battery: 'battery-charging-outline',
    marketValue: 'trending-up-outline',
    driverLicense: 'person-outline',
    payment: 'card-outline',
    parkingTicket: 'car-outline',
  };

  const serviceSubset = (orderedServiceIds.length ? orderedServiceIds : defaultServiceIds).filter((id) =>
    ['payment', 'ipva', 'insurance'].includes(id)
  );

  return (
    <View style={homeStyles.sidebarDrawerRoot}>
      <DrawerContentScrollView {...props} contentContainerStyle={homeStyles.sidebarScrollContent}>
        <LinearGradient colors={['rgb(215, 239, 253)', '#F5FAFF']} style={homeStyles.sidebarHeroGradient}>
          <TouchableOpacity
            style={homeStyles.sidebarProfileCard}
            activeOpacity={0.85}
            onPress={() => {
              navigation.closeDrawer();
              goToStack('Profile');
            }}
            accessibilityRole="button"
            accessibilityLabel="Abrir perfil"
          >
            <View style={homeStyles.sidebarUserInfo}>
              <View style={homeStyles.sidebarAvatarRing}>
                <View style={homeStyles.sidebarAvatar}>
                  {user?.photoURL ? (
                    <Image source={{ uri: user.photoURL }} style={homeStyles.sidebarAvatarImage} resizeMode="cover" />
                  ) : (
                    <Ionicons name="person" size={30} color="#0055FF" />
                  )}
                </View>
              </View>
              <View style={homeStyles.sidebarUserDetails}>
                <Text style={homeStyles.sidebarUserName} numberOfLines={1}>
                  {user?.displayName || 'Usuário'}
                </Text>
                <Text style={homeStyles.sidebarUserEmail} numberOfLines={2}>
                  {user?.email || ' '}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color="#0055FF" style={{ opacity: 0.45 }} />
            </View>
            <Text style={homeStyles.sidebarProfileHint}>Ver perfil e dados da conta</Text>
          </TouchableOpacity>
        </LinearGradient>

        <View style={homeStyles.sidebarSectionsWrap}>
          <Text style={[homeStyles.sidebarSectionLabel, { marginTop: 4 }]}>Conta</Text>
          <SidebarNavRow
            icon="car-outline"
            label="Meus veículos"
            onPress={() => {
              navigation.closeDrawer();
              goToStack('ViewVehicles');
            }}
          />

          <Text style={homeStyles.sidebarSectionLabel}>Serviços rápidos</Text>
          {serviceSubset.map((serviceId) => (
            <SidebarNavRow
              key={`sidebar-${serviceId}`}
              icon={iconMap[serviceId]}
              label={labelMap[serviceId]}
              onPress={() => handleServicePress(serviceId)}
            />
          ))}

          <Text style={homeStyles.sidebarSectionLabel}>Mais opções</Text>
          <SidebarNavRow
            icon="settings-outline"
            label="Configurações de pagamento"
            onPress={() => {
              navigation.closeDrawer();
              goToStack('PaymentSettings');
            }}
          />
          <SidebarNavRow
            icon="help-circle-outline"
            label="Ajuda"
            onPress={() =>
              Alert.alert('Ajuda', 'Em breve você poderá acessar tutoriais e suporte por aqui.')
            }
          />
          <SidebarNavRow
            icon="information-circle-outline"
            label="Sobre o app"
            onPress={() => Alert.alert('E-Park', 'Versão do app com serviços para o seu veículo em um só lugar.')}
          />
        </View>
      </DrawerContentScrollView>

      <View style={homeStyles.sidebarFooter}>
        <TouchableOpacity style={homeStyles.sidebarLogout} onPress={handleLogout} activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={22} color="#FFFFFF" />
          <Text style={homeStyles.sidebarLogoutText}>Sair</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
