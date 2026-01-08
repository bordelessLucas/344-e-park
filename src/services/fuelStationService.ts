// Serviço com localizações de postos de combustível e carregamento elétrico

import { FuelStation } from '../types/fuelStation';

// Base de dados de postos nas cidades de Porto Alegre, Canoas e Esteio
export const FUEL_STATIONS: FuelStation[] = [
  // PORTO ALEGRE - Postos de Gasolina
  {
    id: 'poa-petrobras-1',
    name: 'Posto BR - Ipiranga',
    type: 'gas',
    brand: 'Petrobras',
    address: 'Av. Ipiranga, 5200',
    city: 'Porto Alegre',
    neighborhood: 'Partenon',
    coordinates: { lat: -30.0346, lng: -51.2177 },
    services: ['Gasolina Comum', 'Gasolina Aditivada', 'Etanol', 'Diesel S-10', 'Loja de conveniência', 'Troca de óleo'],
    phone: '(51) 3333-1111',
    hours: '24 horas',
    prices: { gasoline: 5.89, ethanol: 4.29, diesel: 6.19 },
  },
  {
    id: 'poa-shell-1',
    name: 'Shell Select - Bento Gonçalves',
    type: 'gas',
    brand: 'Shell',
    address: 'Av. Bento Gonçalves, 2340',
    city: 'Porto Alegre',
    neighborhood: 'Partenon',
    coordinates: { lat: -30.0456, lng: -51.1897 },
    services: ['Shell V-Power', 'Gasolina Comum', 'Etanol', 'Diesel', 'Café', 'Lavagem'],
    phone: '(51) 3333-2222',
    hours: '24 horas',
    prices: { gasoline: 6.09, ethanol: 4.39, diesel: 6.29 },
  },
  {
    id: 'poa-ipiranga-1',
    name: 'Ipiranga - Protásio Alves',
    type: 'gas',
    brand: 'Ipiranga',
    address: 'Av. Protásio Alves, 4500',
    city: 'Porto Alegre',
    neighborhood: 'Petrópolis',
    coordinates: { lat: -30.0356, lng: -51.1956 },
    services: ['Gasolina Podium', 'Etanol', 'Diesel', 'GNV', 'Loja am/pm'],
    phone: '(51) 3333-3333',
    hours: '06:00 - 22:00',
    prices: { gasoline: 5.99, ethanol: 4.35, diesel: 6.15 },
  },
  {
    id: 'poa-total-1',
    name: 'Posto Total - Assis Brasil',
    type: 'gas',
    brand: 'Total',
    address: 'Av. Assis Brasil, 3456',
    city: 'Porto Alegre',
    neighborhood: 'Sarandi',
    coordinates: { lat: -30.0156, lng: -51.1776 },
    services: ['Gasolina', 'Etanol', 'Diesel', 'Calibragem', 'Loja'],
    phone: '(51) 3333-4444',
    hours: '24 horas',
    prices: { gasoline: 5.85, ethanol: 4.25, diesel: 6.09 },
  },

  // PORTO ALEGRE - Carregadores Elétricos
  {
    id: 'poa-ev-1',
    name: 'Estação Zletric - Shopping Iguatemi',
    type: 'electric',
    address: 'Av. João Wallig, 1800 - Shopping Iguatemi',
    city: 'Porto Alegre',
    neighborhood: 'Passo d\'Areia',
    coordinates: { lat: -30.0256, lng: -51.1656 },
    services: ['Carregamento Rápido', 'Wi-Fi', 'Estacionamento coberto'],
    chargingPower: '150kW',
    chargingPlugs: ['CCS2', 'CHAdeMO'],
    phone: '(51) 3400-5000',
    hours: '09:00 - 22:00',
    prices: { charging: 1.89 },
  },
  {
    id: 'poa-ev-2',
    name: 'Tupinambá Energia - Anita Garibaldi',
    type: 'electric',
    address: 'Av. Anita Garibaldi, 2300',
    city: 'Porto Alegre',
    neighborhood: 'Boa Vista',
    coordinates: { lat: -30.0376, lng: -51.2056 },
    services: ['Carregamento Rápido', 'Café', 'Área de descanso'],
    chargingPower: '100kW',
    chargingPlugs: ['CCS2', 'Type 2'],
    phone: '(51) 3400-6000',
    hours: '24 horas',
    prices: { charging: 1.79 },
  },
  {
    id: 'poa-both-1',
    name: 'Shell Recharge - Praia de Belas',
    type: 'both',
    brand: 'Shell',
    address: 'Av. Praia de Belas, 1212',
    city: 'Porto Alegre',
    neighborhood: 'Praia de Belas',
    coordinates: { lat: -30.0506, lng: -51.2356 },
    services: ['Gasolina', 'Etanol', 'Diesel', 'Carregamento Elétrico', 'Loja Select'],
    chargingPower: '50kW',
    chargingPlugs: ['CCS2'],
    phone: '(51) 3333-7777',
    hours: '24 horas',
    prices: { gasoline: 6.15, ethanol: 4.45, diesel: 6.35, charging: 1.99 },
  },

  // CANOAS - Postos de Gasolina
  {
    id: 'canoas-petrobras-1',
    name: 'Posto BR - Canoas',
    type: 'gas',
    brand: 'Petrobras',
    address: 'Av. Guilherme Schell, 5800',
    city: 'Canoas',
    neighborhood: 'Centro',
    coordinates: { lat: -29.9156, lng: -51.1856 },
    services: ['Gasolina', 'Etanol', 'Diesel', 'GNV', 'Loja BR Mania'],
    phone: '(51) 3472-1111',
    hours: '24 horas',
    prices: { gasoline: 5.79, ethanol: 4.19, diesel: 6.09 },
  },
  {
    id: 'canoas-ipiranga-1',
    name: 'Ipiranga - Farrapos',
    type: 'gas',
    brand: 'Ipiranga',
    address: 'Av. Farrapos, 12500',
    city: 'Canoas',
    neighborhood: 'Mathias Velho',
    coordinates: { lat: -29.9056, lng: -51.1756 },
    services: ['Gasolina Podium', 'Etanol', 'Diesel', 'Troca de óleo', 'am/pm'],
    phone: '(51) 3472-2222',
    hours: '06:00 - 23:00',
    prices: { gasoline: 5.85, ethanol: 4.25, diesel: 6.15 },
  },
  {
    id: 'canoas-shell-1',
    name: 'Shell Box - Shopping Canoas',
    type: 'gas',
    brand: 'Shell',
    address: 'Av. Guilherme Schell, 6750',
    city: 'Canoas',
    neighborhood: 'Centro',
    coordinates: { lat: -29.9256, lng: -51.1956 },
    services: ['Shell V-Power', 'Gasolina', 'Etanol', 'Diesel', 'Shell Box'],
    phone: '(51) 3472-3333',
    hours: '24 horas',
    prices: { gasoline: 6.05, ethanol: 4.35, diesel: 6.25 },
  },

  // CANOAS - Carregador Elétrico
  {
    id: 'canoas-ev-1',
    name: 'EletroVia - Canoas Shopping',
    type: 'electric',
    address: 'Av. Guilherme Schell, 6750 - Canoas Shopping',
    city: 'Canoas',
    neighborhood: 'Centro',
    coordinates: { lat: -29.9266, lng: -51.1966 },
    services: ['Carregamento Rápido', 'Estacionamento Shopping', 'Praça de alimentação'],
    chargingPower: '100kW',
    chargingPlugs: ['CCS2', 'Type 2'],
    phone: '(51) 3476-5000',
    hours: '10:00 - 22:00',
    prices: { charging: 1.85 },
  },

  // ESTEIO - Postos de Gasolina
  {
    id: 'esteio-petrobras-1',
    name: 'Posto BR - Esteio Centro',
    type: 'gas',
    brand: 'Petrobras',
    address: 'Av. Presidente Vargas, 1200',
    city: 'Esteio',
    neighborhood: 'Centro',
    coordinates: { lat: -29.8586, lng: -51.1796 },
    services: ['Gasolina', 'Etanol', 'Diesel S-10', 'Loja', 'Lavagem'],
    phone: '(51) 3473-1111',
    hours: '06:00 - 22:00',
    prices: { gasoline: 5.75, ethanol: 4.15, diesel: 6.05 },
  },
  {
    id: 'esteio-ipiranga-1',
    name: 'Ipiranga - RS-118',
    type: 'gas',
    brand: 'Ipiranga',
    address: 'RS-118, Km 7',
    city: 'Esteio',
    neighborhood: 'Tabaí',
    coordinates: { lat: -29.8686, lng: -51.1696 },
    services: ['Gasolina', 'Etanol', 'Diesel', 'GNV', 'Calibragem'],
    phone: '(51) 3473-2222',
    hours: '24 horas',
    prices: { gasoline: 5.82, ethanol: 4.22, diesel: 6.12 },
  },
  {
    id: 'esteio-both-1',
    name: 'Posto EcoPower - Esteio',
    type: 'both',
    address: 'Av. Presidente Vargas, 2500',
    city: 'Esteio',
    neighborhood: 'Santo Inácio',
    coordinates: { lat: -29.8486, lng: -51.1896 },
    services: ['Gasolina', 'Etanol', 'Diesel', 'Carregamento Elétrico', 'Loja'],
    chargingPower: '50kW',
    chargingPlugs: ['CCS2'],
    phone: '(51) 3473-3333',
    hours: '24 horas',
    prices: { gasoline: 5.79, ethanol: 4.19, diesel: 6.09, charging: 1.75 },
  },
];

// Filtrar postos por cidade
export function getStationsByCity(city: 'Porto Alegre' | 'Canoas' | 'Esteio'): FuelStation[] {
  return FUEL_STATIONS.filter(station => station.city === city);
}

// Filtrar postos por tipo
export function getStationsByType(type: 'gas' | 'electric' | 'both', city?: string): FuelStation[] {
  let stations = FUEL_STATIONS;
  
  if (city) {
    stations = stations.filter(s => s.city === city);
  }
  
  if (type === 'gas') {
    return stations.filter(s => s.type === 'gas' || s.type === 'both');
  } else if (type === 'electric') {
    return stations.filter(s => s.type === 'electric' || s.type === 'both');
  }
  
  return stations;
}

// Buscar postos próximos (simulação)
export function getNearbyStations(city: string, limit: number = 5): FuelStation[] {
  const cityStations = FUEL_STATIONS.filter(s => s.city === city);
  return cityStations.slice(0, limit);
}
