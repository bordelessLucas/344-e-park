export interface PaymentPreferences {
  autoSelectDefaultMethod: boolean;
  requirePaymentConfirmation: boolean;
  notifyAfterPayment: boolean;
}

export const DEFAULT_PAYMENT_PREFERENCES: PaymentPreferences = {
  autoSelectDefaultMethod: true,
  requirePaymentConfirmation: true,
  notifyAfterPayment: true,
};
