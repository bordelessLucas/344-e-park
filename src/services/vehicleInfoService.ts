// Serviço para consultar informações de veículos (Multas, IPVA, Licenciamento)
// Preparado para integração com APIs reais de DETRAN/Governo

interface Fine {
  id: string;
  date: string;
  type: string;
  description: string;
  value: number;
  status: 'pending' | 'paid' | 'disputed';
  location: string;
  code: string; // Código da infração CTB
}

interface IPVAInfo {
  year: number;
  value: number;
  dueDate: string;
  status: 'pending' | 'paid';
  installments?: number;
}

interface LicensingInfo {
  status: 'valid' | 'expired' | 'expiring';
  expiryDate: string;
  daysUntilExpiry: number;
}

interface VehicleRecord {
  placa: string;
  fines: Fine[];
  ipva: IPVAInfo[];
  licensing: LicensingInfo;
  totalFinesPending: number;
  totalFinesPendingValue: number;
}

// ============================================
// CONFIGURAÇÃO DA API REAL (quando disponível)
// ============================================
const API_CONFIG = {
  // Substitua pela sua chave de API quando integrar com serviço real
  // Exemplos: Olho no Carro, Consultas Prime, etc.
  API_KEY: 'SUA_CHAVE_API_AQUI',
  BASE_URL: 'https://www.portaldetransito.rs.gov.br/dtw2/app/servico/vei/consulta-veiculo-form.xhtml',
  USE_REAL_API: false, // Mude para true quando tiver API configurada
};

// Valores reais de multas conforme CTB (Código de Trânsito Brasileiro)
const CTB_MULTAS = {
  LEVE: { valor: 88.38, pontos: 3 },
  MEDIA: { valor: 130.16, pontos: 4 },
  GRAVE: { valor: 195.23, pontos: 5 },
  GRAVISSIMA: { valor: 293.47, pontos: 7 },
  GRAVISSIMA_X3: { valor: 880.41, pontos: 7 }, // Multiplicada por 3
};

// Tipos de infrações reais do CTB com códigos e valores
const INFRACOES_CTB = [
  { 
    code: '51800', 
    type: 'Estacionamento Irregular', 
    categoria: 'LEVE',
    descricao: 'Estacionar afastado da guia da calçada (meio-fio)'
  },
  { 
    code: '50400', 
    type: 'Uso de Celular ao Dirigir', 
    categoria: 'GRAVISSIMA',
    descricao: 'Dirigir segurando ou manuseando telefone celular'
  },
  { 
    code: '74550', 
    type: 'Excesso de Velocidade (até 20%)', 
    categoria: 'MEDIA',
    descricao: 'Transitar em velocidade superior à máxima em até 20%'
  },
  { 
    code: '74630', 
    type: 'Excesso de Velocidade (20% a 50%)', 
    categoria: 'GRAVE',
    descricao: 'Transitar em velocidade superior à máxima entre 20% e 50%'
  },
  { 
    code: '74710', 
    type: 'Excesso de Velocidade (acima de 50%)', 
    categoria: 'GRAVISSIMA',
    descricao: 'Transitar em velocidade superior à máxima em mais de 50%'
  },
  { 
    code: '76331', 
    type: 'Falta de CNH', 
    categoria: 'GRAVISSIMA',
    descricao: 'Dirigir sem possuir CNH ou PPD'
  },
  { 
    code: '52320', 
    type: 'Estacionamento em Vaga Especial', 
    categoria: 'GRAVISSIMA',
    descricao: 'Estacionar em vaga reservada (idoso, deficiente, etc.)'
  },
  { 
    code: '55760', 
    type: 'Avanço de Sinal Vermelho', 
    categoria: 'GRAVISSIMA',
    descricao: 'Avançar o sinal vermelho do semáforo'
  },
  { 
    code: '51650', 
    type: 'Estacionamento em Fila Dupla', 
    categoria: 'GRAVE',
    descricao: 'Parar o veículo em fila dupla'
  },
  { 
    code: '76250', 
    type: 'Falta de Documentação', 
    categoria: 'LEVE',
    descricao: 'Deixar de portar documento do veículo'
  },
];

// ============================================
// FUNÇÃO PARA CONSULTAR API REAL
// ============================================
async function fetchRealVehicleData(placa: string): Promise<VehicleRecord | null> {
  if (!API_CONFIG.USE_REAL_API) {
    return null; // Retorna null para usar dados mockados
  }

  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/vehicle/${placa}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_CONFIG.API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    
    // Transformar dados da API para o formato esperado
    return {
      placa: data.plate || placa,
      fines: data.fines?.map((fine: any) => ({
        id: fine.id || `fine_${Date.now()}`,
        date: fine.date,
        type: fine.type,
        description: fine.description,
        value: fine.value,
        status: fine.status,
        location: fine.location,
        code: fine.code,
      })) || [],
      ipva: data.ipva || [],
      licensing: data.licensing || {
        status: 'valid',
        expiryDate: new Date().toISOString().split('T')[0],
        daysUntilExpiry: 0,
      },
      totalFinesPending: data.totalFinesPending || 0,
      totalFinesPendingValue: data.totalFinesPendingValue || 0,
    };
  } catch (error) {
    console.error('Erro ao consultar API real:', error);
    return null; // Fallback para dados mockados
  }
}

// ============================================
// FUNÇÃO PARA GERAR DADOS MOCKADOS REALISTAS
// ============================================
function generateMockVehicleData(placa: string, vehicleYear: string): VehicleRecord {
  // Função hash para gerar números consistentes baseados na placa
  const hashPlaca = (placa: string, seed: number): number => {
    let hash = seed;
    for (let i = 0; i < placa.length; i++) {
      hash = ((hash << 5) - hash) + placa.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  };

  // Gerar multas realistas
  const fineCount = (hashPlaca(placa, 0) % 4) + 1; // 1 a 4 multas
  const fines: Fine[] = [];

  for (let i = 0; i < fineCount; i++) {
    const seed = hashPlaca(placa, i + 1);
    const infracaoIndex = hashPlaca(placa, i + 300) % INFRACOES_CTB.length;
    const infracao = INFRACOES_CTB[infracaoIndex];
    const categoria = infracao.categoria as keyof typeof CTB_MULTAS;
    
    const isPaid = (seed % 10) > 6;
    const isDisputed = !isPaid && ((seed % 10) > 8);

    // Gerar data dos últimos 12 meses
    const monthsAgo = hashPlaca(placa, i + 100) % 12;
    const date = new Date();
    date.setMonth(date.getMonth() - monthsAgo);
    date.setDate((hashPlaca(placa, i + 200) % 28) + 1);

    fines.push({
      id: `${infracao.code}_${placa}_${i}`,
      date: date.toISOString().split('T')[0],
      type: infracao.type,
      description: infracao.descricao,
      value: CTB_MULTAS[categoria].valor,
      status: isPaid ? 'paid' : isDisputed ? 'disputed' : 'pending',
      location: ['Av. Oceânica, Salvador-BA', 'Av. Getúlio Vargas, Rio de Janeiro-RJ', 'Rua do Ouvidor, Rio de Janeiro-RJ', 'Av. Paulista, São Paulo-SP', 'Rua XV de Novembro, Curitiba-PR'][
        hashPlaca(placa, i + 600) % 5
      ],
      code: infracao.code,
    });
  }

  // Gerar dados de IPVA realistas
  const currentYear = new Date().getFullYear();
  const ipvaYears: IPVAInfo[] = [];
  const carYear = parseInt(vehicleYear);
  const carAge = currentYear - carYear;

  for (let year = currentYear - 1; year <= currentYear + 1; year++) {
    // Valor base médio de um carro popular (ajustar conforme necessário)
    let baseValue = 45000; // Valor venal médio

    // Depreciação por idade
    const ageAtYear = year - carYear;
    if (ageAtYear > 20) baseValue *= 0.15;
    else if (ageAtYear > 15) baseValue *= 0.25;
    else if (ageAtYear > 10) baseValue *= 0.40;
    else if (ageAtYear > 5) baseValue *= 0.60;
    else if (ageAtYear > 0) baseValue *= 0.80;

    // Alíquota média de IPVA (4% na maioria dos estados)
    const ipvaValue = baseValue * 0.04;

    // Data de vencimento varia por final de placa
    const finalPlaca = parseInt(placa.slice(-1)) || 0;
    const dueMonth = finalPlaca % 2 === 0 ? 1 : 2; // Janeiro ou Fevereiro
    const dueDate = new Date(year, dueMonth - 1, finalPlaca + 10); // Dia baseado no final

    const isPast = year < currentYear;
    const isCurrentAndOverdue = year === currentYear && new Date() > dueDate;

    ipvaYears.push({
      year,
      value: Math.round(ipvaValue * 100) / 100,
      dueDate: dueDate.toISOString().split('T')[0],
      status: (isPast || isCurrentAndOverdue) ? 'paid' : 'pending',
      installments: 3, // Opção de 3 parcelas
    });
  }

  // Gerar dados de licenciamento
  const licensingMonth = Math.floor(carAge / 2) % 12; // Mês baseado na idade do carro
  const licensingExpiry = new Date(currentYear, licensingMonth, 1);
  const today = new Date();
  const daysUntil = Math.floor((licensingExpiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  let licensingStatus: 'valid' | 'expired' | 'expiring' = 'valid';
  if (daysUntil < 0) {
    licensingStatus = 'expired';
  } else if (daysUntil < 30) {
    licensingStatus = 'expiring';
  }

  const pendingFines = fines.filter(f => f.status === 'pending');
  const totalPendingValue = pendingFines.reduce((sum, f) => sum + f.value, 0);

  return {
    placa,
    fines,
    ipva: ipvaYears,
    licensing: {
      status: licensingStatus,
      expiryDate: licensingExpiry.toISOString().split('T')[0],
      daysUntilExpiry: daysUntil,
    },
    totalFinesPending: pendingFines.length,
    totalFinesPendingValue: totalPendingValue,
  };
}

// ============================================
// FUNÇÃO PRINCIPAL DE CONSULTA
// ============================================
export async function getVehicleRecord(placa: string, vehicleYear: string): Promise<VehicleRecord> {
  // Tentar buscar dados reais primeiro
  const realData = await fetchRealVehicleData(placa);
  
  if (realData) {
    console.log('✓ Dados reais obtidos da API');
    return realData;
  }

  // Fallback para dados mockados realistas
  console.log('ℹ Usando dados mockados (para usar dados reais, configure API_CONFIG)');
  return generateMockVehicleData(placa, vehicleYear);
}

export { Fine, IPVAInfo, LicensingInfo, VehicleRecord };
