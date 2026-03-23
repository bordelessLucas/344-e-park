import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_PAYMENT_PREFERENCES,
  PaymentPreferences,
} from '../types/paymentPreferences';

const STORAGE_PREFIX = '@epark:payment_preferences:';

const buildStorageKey = (userId: string): string => `${STORAGE_PREFIX}${userId}`;

export async function getPaymentPreferences(userId: string): Promise<PaymentPreferences> {
  try {
    const raw = await AsyncStorage.getItem(buildStorageKey(userId));
    if (!raw) {
      return DEFAULT_PAYMENT_PREFERENCES;
    }

    const parsed = JSON.parse(raw) as Partial<PaymentPreferences>;
    return {
      ...DEFAULT_PAYMENT_PREFERENCES,
      ...parsed,
    };
  } catch (error) {
    console.error('Erro ao buscar preferências de pagamento:', error);
    return DEFAULT_PAYMENT_PREFERENCES;
  }
}

export async function savePaymentPreferences(
  userId: string,
  preferences: PaymentPreferences
): Promise<void> {
  await AsyncStorage.setItem(buildStorageKey(userId), JSON.stringify(preferences));
}
