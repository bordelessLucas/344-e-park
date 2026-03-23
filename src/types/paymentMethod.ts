export type PaymentMethodType = 'credit_card' | 'debit_card' | 'pix';

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  nickname: string;
  holderName?: string;
  cardNumberMasked?: string;
  expiresAt?: string;
  pixKeyMasked?: string;
  isDefault: boolean;
  createdAt: string;
}

export interface CreatePaymentMethodInput {
  type: PaymentMethodType;
  nickname: string;
  holderName?: string;
  cardNumber?: string;
  expiresAt?: string;
  pixKey?: string;
}
