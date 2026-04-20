export interface ParkingHistoryEntry {
  id: string;
  createdAt: string;
  ticketNumber: string;
  location: string;
  street: string;
  value: number;
  vehiclePlate: string;
  vehicleModel: string;
  paymentMethodLabel: string;
  /** Indica registro simulado (sem gateway de pagamento). */
  simulated: true;
}
