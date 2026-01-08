// Tipos para serviço de baterias

export interface BatteryProduct {
  id: string;
  name: string;
  model: string;
  amperage: string; // Ex: "60Ah", "70Ah"
  voltage: string; // Ex: "12V"
  price: number;
  warranty: string; // Ex: "24 meses"
  vehicleTypes: string[]; // Ex: ["Carro", "Motocicleta"]
  description: string;
}

export interface BatteryOrder {
  id: string;
  batteryId: string;
  batteryName: string;
  vehiclePlaca?: string;
  vehicleModel?: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  deliveryTime: string; // Ex: "50 minutos"
  price: number;
  status: 'pending' | 'confirmed' | 'delivering' | 'delivered' | 'cancelled';
  orderDate: string;
  estimatedDelivery: string;
}
