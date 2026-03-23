import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CreatePaymentMethodInput,
  PaymentMethod,
} from '../types/paymentMethod';

const STORAGE_PREFIX = '@epark:payment_methods:';

const buildStorageKey = (userId: string): string => `${STORAGE_PREFIX}${userId}`;

const normalizeCardMask = (rawNumber: string): string => {
  const digits = rawNumber.replace(/\D/g, '');
  const last4 = digits.slice(-4);
  return `**** **** **** ${last4}`;
};

const normalizePixMask = (pixKey: string): string => {
  const value = pixKey.trim();
  if (value.length <= 4) {
    return value;
  }
  return `${value.slice(0, 2)}***${value.slice(-2)}`;
};

export async function getPaymentMethods(userId: string): Promise<PaymentMethod[]> {
  try {
    const rawData = await AsyncStorage.getItem(buildStorageKey(userId));
    if (!rawData) {
      return [];
    }

    const parsed = JSON.parse(rawData) as PaymentMethod[];
    return parsed.sort((a, b) => {
      if (a.isDefault && !b.isDefault) {
        return -1;
      }
      if (!a.isDefault && b.isDefault) {
        return 1;
      }
      return b.createdAt.localeCompare(a.createdAt);
    });
  } catch (error) {
    console.error('Erro ao buscar métodos de pagamento:', error);
    return [];
  }
}

export async function createPaymentMethod(
  userId: string,
  payload: CreatePaymentMethodInput
): Promise<PaymentMethod> {
  const methods = await getPaymentMethods(userId);
  const hasDefault = methods.some((item) => item.isDefault);

  const newMethod: PaymentMethod = {
    id: `${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
    type: payload.type,
    nickname: payload.nickname.trim(),
    holderName: payload.holderName?.trim() || undefined,
    cardNumberMasked: payload.cardNumber
      ? normalizeCardMask(payload.cardNumber)
      : undefined,
    expiresAt: payload.expiresAt?.trim() || undefined,
    pixKeyMasked: payload.pixKey ? normalizePixMask(payload.pixKey) : undefined,
    isDefault: !hasDefault,
    createdAt: new Date().toISOString(),
  };

  const updated = [newMethod, ...methods.map((item) => ({ ...item, isDefault: hasDefault ? item.isDefault : false }))];

  await AsyncStorage.setItem(buildStorageKey(userId), JSON.stringify(updated));
  return newMethod;
}

export async function deletePaymentMethod(userId: string, methodId: string): Promise<PaymentMethod[]> {
  const methods = await getPaymentMethods(userId);
  const filtered = methods.filter((item) => item.id !== methodId);

  if (filtered.length > 0 && !filtered.some((item) => item.isDefault)) {
    filtered[0] = { ...filtered[0], isDefault: true };
  }

  await AsyncStorage.setItem(buildStorageKey(userId), JSON.stringify(filtered));
  return filtered;
}

export async function setDefaultPaymentMethod(userId: string, methodId: string): Promise<PaymentMethod[]> {
  const methods = await getPaymentMethods(userId);
  const updated = methods.map((item) => ({
    ...item,
    isDefault: item.id === methodId,
  }));

  await AsyncStorage.setItem(buildStorageKey(userId), JSON.stringify(updated));
  return updated;
}
