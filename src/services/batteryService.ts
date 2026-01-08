// Serviço para gerenciar pedidos de baterias Moura

import AsyncStorage from '@react-native-async-storage/async-storage';
import { BatteryProduct, BatteryOrder } from '../types/battery';

const STORAGE_KEY = '@epark:battery_orders';

// Catálogo de baterias Moura disponíveis
export const MOURA_BATTERIES: BatteryProduct[] = [
  {
    id: 'moura-60ah',
    name: 'Moura Clean',
    model: 'M60GD',
    amperage: '60Ah',
    voltage: '12V',
    price: 489.90,
    warranty: '24 meses',
    vehicleTypes: ['Carro'],
    description: 'Bateria ideal para carros de pequeno e médio porte. Livre de manutenção.',
  },
  {
    id: 'moura-70ah',
    name: 'Moura Clean',
    model: 'M70KD',
    amperage: '70Ah',
    voltage: '12V',
    price: 589.90,
    warranty: '24 meses',
    vehicleTypes: ['Carro'],
    description: 'Bateria para carros médios e grandes. Maior capacidade de partida.',
  },
  {
    id: 'moura-45ah',
    name: 'Moura Clean',
    model: 'M45FD',
    amperage: '45Ah',
    voltage: '12V',
    price: 389.90,
    warranty: '18 meses',
    vehicleTypes: ['Carro'],
    description: 'Bateria compacta para carros pequenos e econômicos.',
  },
  {
    id: 'moura-100ah',
    name: 'Moura Clean',
    model: 'M100TD',
    amperage: '100Ah',
    voltage: '12V',
    price: 789.90,
    warranty: '30 meses',
    vehicleTypes: ['Caminhonete', 'Van'],
    description: 'Bateria de alta capacidade para veículos pesados e com muitos acessórios.',
  },
  {
    id: 'moura-moto-5ah',
    name: 'Moura Moto',
    model: 'MA5-D',
    amperage: '5Ah',
    voltage: '12V',
    price: 189.90,
    warranty: '12 meses',
    vehicleTypes: ['Motocicleta'],
    description: 'Bateria específica para motocicletas de pequeno porte.',
  },
  {
    id: 'moura-moto-8ah',
    name: 'Moura Moto',
    model: 'MA8-E',
    amperage: '8Ah',
    voltage: '12V',
    price: 249.90,
    warranty: '12 meses',
    vehicleTypes: ['Motocicleta'],
    description: 'Bateria para motocicletas de médio e grande porte.',
  },
];

// Salvar pedido
export async function saveBatteryOrder(order: Omit<BatteryOrder, 'id' | 'orderDate' | 'status'>): Promise<BatteryOrder> {
  try {
    const orders = await getAllBatteryOrders();
    const newOrder: BatteryOrder = {
      ...order,
      id: Date.now().toString(),
      orderDate: new Date().toISOString(),
      status: 'pending',
    };
    
    const updatedOrders = [...orders, newOrder];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedOrders));
    
    return newOrder;
  } catch (error) {
    console.error('Erro ao salvar pedido:', error);
    throw error;
  }
}

// Buscar todos os pedidos
export async function getAllBatteryOrders(): Promise<BatteryOrder[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    return [];
  }
}

// Atualizar status do pedido
export async function updateOrderStatus(orderId: string, status: BatteryOrder['status']): Promise<boolean> {
  try {
    const orders = await getAllBatteryOrders();
    const index = orders.findIndex(o => o.id === orderId);
    
    if (index === -1) return false;
    
    orders[index].status = status;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    
    return true;
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    return false;
  }
}

// Cancelar pedido
export async function cancelBatteryOrder(orderId: string): Promise<boolean> {
  return updateOrderStatus(orderId, 'cancelled');
}

// Calcular tempo estimado de entrega
export function calculateDeliveryTime(): string {
  const baseTime = 40; // minutos base
  const variation = Math.floor(Math.random() * 20); // variação de 0-20 min
  return `${baseTime + variation} minutos`;
}

// Link para o site da Moura (caso o usuário queira mais informações)
export const MOURA_WEBSITE = 'https://www.moura.com.br';
export const MOURA_CONTACT_PHONE = '0800 701 6060';
