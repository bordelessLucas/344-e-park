// Tipos para tickets de estacionamento e garagens

export interface ParkingTicket {
  id: string;
  ticketCode: string;
  type: 'shopping' | 'garage' | 'street' | 'event' | 'airport';
  locationName: string;
  address: string;
  entryTime: string;
  exitTime?: string;
  duration?: number; // em minutos
  pricePerHour: number;
  totalAmount: number;
  status: 'active' | 'paid' | 'expired';
  vehiclePlate?: string;
  paymentDate?: string;
}

export interface TicketPayment {
  ticketId: string;
  amount: number;
  paymentMethod: 'credit' | 'debit' | 'pix' | 'money';
  paymentDate: string;
  status: 'pending' | 'confirmed' | 'failed';
}

export type ParkingType = 'shopping' | 'garage' | 'street' | 'event' | 'airport';
