// Serviço para gerenciar tickets de estacionamento e garagens

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ParkingTicket, TicketPayment } from '../types/parkingTicket';

const STORAGE_KEY = '@epark:parking_tickets';

// Simular busca de ticket por código
export async function getTicketByCode(ticketCode: string): Promise<ParkingTicket | null> {
  // Em produção, isso faria uma chamada à API do estacionamento
  // Por enquanto, vamos simular com dados mockados
  
  // Gerar dados baseados no código do ticket
  const hash = ticketCode.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const types: ParkingTicket['type'][] = ['shopping', 'garage', 'street', 'event', 'airport'];
  const type = types[hash % types.length];
  
  const locations = {
    shopping: [
      { name: 'Shopping Iguatemi', address: 'Av. João Wallig, 1800 - Porto Alegre' },
      { name: 'Shopping Praia de Belas', address: 'Av. Praia de Belas, 1181 - Porto Alegre' },
      { name: 'Canoas Shopping', address: 'Av. Guilherme Schell, 6750 - Canoas' },
      { name: 'BarraShoppingSul', address: 'Av. Diário de Notícias, 300 - Porto Alegre' },
    ],
    garage: [
      { name: 'Estacionamento Centro Histórico', address: 'Rua dos Andradas, 1234 - Porto Alegre' },
      { name: 'Garagem Independência', address: 'Av. Independência, 567 - Porto Alegre' },
      { name: 'Park Center', address: 'Rua Voluntários da Pátria, 890 - Canoas' },
    ],
    street: [
      { name: 'Zona Azul - Centro', address: 'Rua dos Andradas - Porto Alegre' },
      { name: 'Zona Azul - Cidade Baixa', address: 'Av. José de Alencar - Porto Alegre' },
    ],
    event: [
      { name: 'Arena do Grêmio', address: 'Av. Padre Leopoldo Brentano, 110 - Porto Alegre' },
      { name: 'Estádio Beira-Rio', address: 'Av. Padre Cacique, 891 - Porto Alegre' },
    ],
    airport: [
      { name: 'Aeroporto Salgado Filho', address: 'Av. dos Estados - Porto Alegre' },
    ],
  };
  
  const locationList = locations[type];
  const location = locationList[hash % locationList.length];
  
  // Simular tempo de entrada (entre 1 e 8 horas atrás)
  const hoursAgo = (hash % 8) + 1;
  const entryTime = new Date();
  entryTime.setHours(entryTime.getHours() - hoursAgo);
  
  const pricePerHour = type === 'shopping' ? 8.0 : 
                       type === 'garage' ? 12.0 : 
                       type === 'street' ? 3.5 : 
                       type === 'event' ? 15.0 : 
                       type === 'airport' ? 20.0 : 10.0;
  
  const duration = hoursAgo * 60; // minutos
  const totalAmount = Math.ceil(duration / 60) * pricePerHour;
  
  return {
    id: `ticket_${Date.now()}`,
    ticketCode,
    type,
    locationName: location.name,
    address: location.address,
    entryTime: entryTime.toISOString(),
    duration,
    pricePerHour,
    totalAmount: Math.round(totalAmount * 100) / 100,
    status: 'active',
  };
}

// Salvar pagamento de ticket
export async function payTicket(
  ticket: ParkingTicket,
  paymentMethod: TicketPayment['paymentMethod']
): Promise<TicketPayment> {
  try {
    const payment: TicketPayment = {
      ticketId: ticket.id,
      amount: ticket.totalAmount,
      paymentMethod,
      paymentDate: new Date().toISOString(),
      status: 'confirmed',
    };
    
    // Salvar no histórico
    const history = await getPaymentHistory();
    const updatedHistory = [...history, { ...ticket, paymentDate: payment.paymentDate, status: 'paid' as const }];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
    
    return payment;
  } catch (error) {
    console.error('Erro ao processar pagamento:', error);
    throw error;
  }
}

// Buscar histórico de pagamentos
export async function getPaymentHistory(): Promise<ParkingTicket[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    return [];
  }
}

// Calcular duração em formato legível
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) {
    return `${mins} minutos`;
  } else if (mins === 0) {
    return `${hours} ${hours === 1 ? 'hora' : 'horas'}`;
  } else {
    return `${hours}h ${mins}min`;
  }
}

// Obter label do tipo de estacionamento
export function getParkingTypeLabel(type: ParkingTicket['type']): string {
  const labels = {
    shopping: 'Shopping',
    garage: 'Garagem',
    street: 'Zona Azul',
    event: 'Evento',
    airport: 'Aeroporto',
  };
  return labels[type];
}

// Obter cor do tipo de estacionamento
export function getParkingTypeColor(type: ParkingTicket['type']): string {
  const colors = {
    shopping: '#9C27B0',
    garage: '#FF9800',
    street: '#2196F3',
    event: '#F44336',
    airport: '#4CAF50',
  };
  return colors[type];
}
