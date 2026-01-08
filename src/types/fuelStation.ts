// Tipos para postos de combustível e pontos de carregamento

export interface FuelStation {
  id: string;
  name: string;
  type: 'gas' | 'electric' | 'both'; // posto gasolina, elétrico ou ambos
  brand?: string; // Petrobras, Ipiranga, Shell, etc.
  address: string;
  city: 'Porto Alegre' | 'Canoas' | 'Esteio';
  neighborhood: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  services: string[]; // Ex: ['Gasolina Comum', 'Etanol', 'Diesel', 'Loja de conveniência']
  chargingPower?: string; // Para elétricos: '50kW', '150kW', etc.
  chargingPlugs?: string[]; // ['CCS2', 'CHAdeMO', 'Type 2']
  phone?: string;
  hours?: string;
  prices?: {
    gasoline?: number;
    ethanol?: number;
    diesel?: number;
    charging?: number; // preço por kWh
  };
}

export type StationType = 'all' | 'gas' | 'electric';
