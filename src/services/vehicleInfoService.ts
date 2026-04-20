// IPVA, multas e licenciamento: fluxo híbrido 100% client-side (fetch público + simulação determinística).
// Backend opcional (EXPO_PUBLIC_VEHICLE_INFO_API_*) continua tendo prioridade se configurado.

import { getVehicleInfoApiBase, getVehicleInfoApiKey } from '../config/appConfig';
import { fetchFipeVehiclePrice } from './fipeVehiclePrice';

export interface Fine {
  id: string;
  date: string;
  type: string;
  description: string;
  value: number;
  status: 'pending' | 'paid' | 'disputed';
  location: string;
  code: string;
  severity?: 'leve' | 'media' | 'grave' | 'gravissima';
  dataOrigin?: 'simulated';
}

export interface IPVAInfo {
  year: number;
  value: number;
  dueDate: string;
  status: 'pending' | 'paid';
  installments?: number;
  calculationType?: 'estimated';
  dataOrigin?: 'estimated';
}

export interface LicensingInfo {
  status: 'valid' | 'expired' | 'expiring';
  expiryDate: string;
  daysUntilExpiry: number;
  simulationType?: 'simulated';
  dataOrigin?: 'simulated';
}

export interface VehicleInfoBlock {
  brand: string;
  model: string;
  year: number;
  fuel: string;
  dataOrigin: 'api' | 'cadastro' | 'simulated';
}

export interface VehicleRecord {
  /** Mesmo valor informado pelo usuário (ex.: ABC-1D23) */
  plate: string;
  placa: string;
  vehicle?: VehicleInfoBlock;
  /** Valor numérico FIPE (R$), quando obtido */
  fipeValue: number | null;
  fines: Fine[];
  ipva: IPVAInfo[];
  licensing: LicensingInfo;
  totalFinesPending: number;
  totalFinesPendingValue: number;
}

export type VehicleRecordQueryResult = {
  record: VehicleRecord;
  /** `api` = backend configurado; `hybrid` = BrasilAPI/placa + FIPE + simulações; `mock` = fallback local */
  source: 'api' | 'mock' | 'hybrid';
};

/** Entrada mínima (compatível com VehicleData do cadastro) */
export interface VehicleRecordInput {
  placa: string;
  modelo: string;
  ano: string;
  tipo: string;
}

const BRASIL_API_PLACA = 'https://brasilapi.com.br/api/placa/v1';

const TIER_VALUE: Record<'LEVE' | 'MEDIA' | 'GRAVE' | 'GRAVISSIMA' | 'GRAVISSIMA_X3', number> = {
  LEVE: 88,
  MEDIA: 130,
  GRAVE: 195,
  GRAVISSIMA: 293,
  GRAVISSIMA_X3: 293,
};

const INFRACOES_CTB: {
  code: string;
  type: string;
  categoria: keyof typeof TIER_VALUE;
  descricao: string;
}[] = [
  { code: '51800', type: 'Estacionamento Irregular', categoria: 'LEVE', descricao: 'Estacionar afastado da guia da calçada (meio-fio)' },
  { code: '50400', type: 'Uso de Celular ao Dirigir', categoria: 'GRAVISSIMA', descricao: 'Dirigir segurando ou manuseando telefone celular' },
  { code: '74550', type: 'Excesso de Velocidade (até 20%)', categoria: 'MEDIA', descricao: 'Transitar em velocidade superior à máxima em até 20%' },
  { code: '74630', type: 'Excesso de Velocidade (20% a 50%)', categoria: 'GRAVE', descricao: 'Transitar em velocidade superior à máxima entre 20% e 50%' },
  { code: '74710', type: 'Excesso de Velocidade (acima de 50%)', categoria: 'GRAVISSIMA', descricao: 'Transitar em velocidade superior à máxima em mais de 50%' },
  { code: '76331', type: 'Falta de CNH', categoria: 'GRAVISSIMA', descricao: 'Dirigir sem possuir CNH ou PPD' },
  { code: '52320', type: 'Estacionamento em Vaga Especial', categoria: 'GRAVISSIMA', descricao: 'Estacionar em vaga reservada (idoso, deficiente, etc.)' },
  { code: '55760', type: 'Avanço de Sinal Vermelho', categoria: 'GRAVISSIMA', descricao: 'Avançar o sinal vermelho do semáforo' },
  { code: '51650', type: 'Estacionamento em Fila Dupla', categoria: 'GRAVE', descricao: 'Parar o veículo em fila dupla' },
  { code: '76250', type: 'Falta de Documentação', categoria: 'LEVE', descricao: 'Deixar de portar documento do veículo' },
];

const LOCATIONS = [
  'Av. Oceânica, Salvador-BA',
  'Av. Getúlio Vargas, Rio de Janeiro-RJ',
  'Rua do Ouvidor, Rio de Janeiro-RJ',
  'Av. Paulista, São Paulo-SP',
  'Rua XV de Novembro, Curitiba-PR',
];

function normalizePlateKey(placa: string): string {
  return placa.replace(/\s/g, '').replace(/-/g, '').toUpperCase();
}

function hashPlaca(placa: string, seed: number): number {
  let hash = seed;
  const s = normalizePlateKey(placa);
  for (let i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function inferBrandFromModel(modelo: string): string {
  const t = modelo.trim();
  if (!t) return 'Indefinido';
  return t.split(/\s+/)[0];
}

function lastDigitFromPlate(placa: string): number {
  const digits = normalizePlateKey(placa).replace(/\D/g, '');
  if (digits.length === 0) return 0;
  return parseInt(digits.slice(-1), 10) || 0;
}

/** Mês de vencimento do licenciamento (calendário 3–7 = março–julho) */
function licensingMonthFromLastDigit(d: number): number {
  if (d === 1 || d === 2) return 3;
  if (d === 3 || d === 4) return 4;
  if (d === 5 || d === 6) return 5;
  if (d === 7 || d === 8) return 6;
  return 7;
}

/** Último dia do mês (1–12) */
function lastDayOfCalendarMonth(year: number, monthCal: number): Date {
  return new Date(year, monthCal, 0);
}

/**
 * IPVA estimado (RS ~3,5% do valor FIPE). Regra simples de status: após março considera "pago" o exercício atual.
 */
export function calculateIPVA(
  fipeValue: number,
  estado: string = 'RS'
): { year: number; value: number; status: 'pending' | 'paid'; type: 'estimated'; dueDate: string } {
  const rate = estado === 'RS' ? 0.035 : 0.035;
  const value = Math.round(fipeValue * rate * 100) / 100;
  const year = new Date().getFullYear();
  const now = new Date();
  const month = now.getMonth();
  const status: 'pending' | 'paid' = month >= 3 ? 'paid' : 'pending';
  return {
    year,
    value,
    status,
    type: 'estimated',
    dueDate: `${year}-03-31`,
  };
}

function buildSimulatedLicensing(placa: string): LicensingInfo {
  const digit = lastDigitFromPlate(placa);
  const monthCal = licensingMonthFromLastDigit(digit);
  const year = new Date().getFullYear();
  const expiry = lastDayOfCalendarMonth(year, monthCal);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expiry);
  exp.setHours(0, 0, 0, 0);
  const daysUntil = Math.floor((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  let status: LicensingInfo['status'];
  if (daysUntil < 0) {
    status = 'expired';
  } else if (daysUntil <= 30) {
    status = 'expiring';
  } else {
    status = 'valid';
  }

  return {
    status,
    expiryDate: exp.toISOString().split('T')[0],
    daysUntilExpiry: daysUntil,
    simulationType: 'simulated',
    dataOrigin: 'simulated',
  };
}

function severityFromCategory(cat: keyof typeof TIER_VALUE): Fine['severity'] {
  if (cat === 'LEVE') return 'leve';
  if (cat === 'MEDIA') return 'media';
  if (cat === 'GRAVE') return 'grave';
  return 'gravissima';
}

function buildSimulatedFines(placa: string): Fine[] {
  const count = hashPlaca(placa, 11) % 4;
  const fines: Fine[] = [];
  for (let i = 0; i < count; i++) {
    const seed = hashPlaca(placa, i + 1);
    const idx = hashPlaca(placa, i + 300) % INFRACOES_CTB.length;
    const inf = INFRACOES_CTB[idx];
    const cat = inf.categoria;
    const value = TIER_VALUE[cat];
    const isPaid = seed % 10 > 6;
    const isDisputed = !isPaid && seed % 10 > 8;
    const monthsAgo = hashPlaca(placa, i + 100) % 12;
    const date = new Date();
    date.setMonth(date.getMonth() - monthsAgo);
    date.setDate((hashPlaca(placa, i + 200) % 28) + 1);

    fines.push({
      id: `sim_${inf.code}_${normalizePlateKey(placa)}_${i}`,
      date: date.toISOString().split('T')[0],
      type: inf.type,
      description: inf.descricao,
      value,
      status: isPaid ? 'paid' : isDisputed ? 'disputed' : 'pending',
      location: LOCATIONS[hashPlaca(placa, i + 600) % LOCATIONS.length],
      code: inf.code,
      severity: severityFromCategory(cat),
      dataOrigin: 'simulated',
    });
  }
  return fines;
}

function normalizeVehicleRecord(raw: VehicleRecord): VehicleRecord {
  const pending = raw.fines.filter((f) => f.status === 'pending');
  const sum = pending.reduce((s, f) => s + f.value, 0);
  return {
    ...raw,
    totalFinesPending: pending.length,
    totalFinesPendingValue: sum,
  };
}

interface BrasilApiPlacaResponse {
  placa?: string;
  marca?: string;
  modelo?: string;
  ano?: number;
  anoModelo?: number;
  combustivel?: string;
  message?: string;
}

async function fetchBrasilApiPlaca(placa: string): Promise<BrasilApiPlacaResponse | null> {
  const slug = encodeURIComponent(normalizePlateKey(placa));
  try {
    const response = await fetch(`${BRASIL_API_PLACA}/${slug}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return null;
    const text = await response.text();
    if (text.trim().startsWith('<')) return null;
    const data = JSON.parse(text) as BrasilApiPlacaResponse;
    if (data.message && typeof data.message === 'string' && data.message.toLowerCase().includes('erro')) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

async function fetchRealVehicleData(placa: string): Promise<VehicleRecord | null> {
  const base = getVehicleInfoApiBase();
  if (!base) {
    return null;
  }

  const slug = encodeURIComponent(placa.replace(/\s/g, '').toUpperCase());
  const key = getVehicleInfoApiKey();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (key && !/placeholder|xxxxx/i.test(key)) {
    headers.Authorization = `Bearer ${key}`;
  }

  try {
    const response = await fetch(`${base}/vehicle/${slug}`, {
      method: 'GET',
      headers,
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`vehicle info API: ${response.status}`);
    }

    const data = (await response.json()) as Record<string, unknown>;

    const finesRaw = Array.isArray(data.fines) ? data.fines : [];
    const fines: Fine[] = finesRaw.map((fine: any, idx: number) => ({
      id: String(fine.id ?? `fine_${idx}`),
      date: String(fine.date ?? ''),
      type: String(fine.type ?? ''),
      description: String(fine.description ?? ''),
      value: Number(fine.value) || 0,
      status: (fine.status as Fine['status']) ?? 'pending',
      location: String(fine.location ?? ''),
      code: String(fine.code ?? ''),
    }));

    const ipvaRaw = Array.isArray(data.ipva) ? data.ipva : [];
    const ipva: IPVAInfo[] = ipvaRaw.map((row: any) => ({
      year: Number(row.year) || new Date().getFullYear(),
      value: Number(row.value) || 0,
      dueDate: String(row.dueDate ?? ''),
      status: (row.status as IPVAInfo['status']) ?? 'pending',
      installments: row.installments != null ? Number(row.installments) : undefined,
    }));

    const lic = data.licensing as Record<string, unknown> | undefined;
    const licensing: LicensingInfo = lic
      ? {
          status: (lic.status as LicensingInfo['status']) ?? 'valid',
          expiryDate: String(lic.expiryDate ?? ''),
          daysUntilExpiry: Number(lic.daysUntilExpiry) || 0,
        }
      : {
          status: 'valid',
          expiryDate: new Date().toISOString().split('T')[0],
          daysUntilExpiry: 0,
        };

    const plateStr = String(data.plate ?? data.placa ?? placa).toUpperCase();

    const record: VehicleRecord = normalizeVehicleRecord({
      plate: plateStr,
      placa: plateStr,
      fipeValue: typeof data.fipeValue === 'number' ? data.fipeValue : null,
      fines,
      ipva,
      licensing,
      totalFinesPending: typeof data.totalFinesPending === 'number' ? data.totalFinesPending : 0,
      totalFinesPendingValue: typeof data.totalFinesPendingValue === 'number' ? data.totalFinesPendingValue : 0,
    });

    return record;
  } catch (error) {
    if (__DEV__) {
      console.warn('vehicleInfoService: API indisponível.', error);
    }
    return null;
  }
}

function buildHybridRecord(
  input: VehicleRecordInput,
  opts: {
    vehicleBlock: VehicleInfoBlock;
    fipeValue: number;
  }
): VehicleRecord {
  const plateStr = input.placa.trim().toUpperCase();
  const ipvaCalc = calculateIPVA(opts.fipeValue, 'RS');
  const ipva: IPVAInfo[] = [
    {
      year: ipvaCalc.year,
      value: ipvaCalc.value,
      dueDate: ipvaCalc.dueDate,
      status: ipvaCalc.status,
      installments: 3,
      calculationType: 'estimated',
      dataOrigin: 'estimated',
    },
  ];

  const fines = buildSimulatedFines(input.placa);
  const licensing = buildSimulatedLicensing(input.placa);

  return normalizeVehicleRecord({
    plate: plateStr,
    placa: plateStr,
    vehicle: opts.vehicleBlock,
    fipeValue: opts.fipeValue,
    fines,
    ipva,
    licensing,
    totalFinesPending: 0,
    totalFinesPendingValue: 0,
  });
}

function generateMockVehicleData(input: VehicleRecordInput): VehicleRecord {
  const placa = input.placa.trim().toUpperCase();
  const currentYear = new Date().getFullYear();
  const carYear = parseInt(input.ano, 10) || currentYear;
  const baseValue = 45000;
  let venal = baseValue;
  const ageAtYear = currentYear - carYear;
  if (ageAtYear > 20) venal *= 0.15;
  else if (ageAtYear > 15) venal *= 0.25;
  else if (ageAtYear > 10) venal *= 0.4;
  else if (ageAtYear > 5) venal *= 0.6;
  else if (ageAtYear > 0) venal *= 0.8;

  const ipvaCalc = calculateIPVA(venal, 'RS');
  const ipva: IPVAInfo[] = [
    {
      year: currentYear - 1,
      value: Math.round(ipvaCalc.value * 0.95 * 100) / 100,
      dueDate: `${currentYear - 1}-03-31`,
      status: 'paid',
      calculationType: 'estimated',
      dataOrigin: 'estimated',
    },
    {
      year: ipvaCalc.year,
      value: ipvaCalc.value,
      dueDate: ipvaCalc.dueDate,
      status: ipvaCalc.status,
      installments: 3,
      calculationType: 'estimated',
      dataOrigin: 'estimated',
    },
  ];

  const fines = buildSimulatedFines(input.placa);
  const licensing = buildSimulatedLicensing(input.placa);

  return normalizeVehicleRecord({
    plate: placa,
    placa,
    vehicle: {
      brand: inferBrandFromModel(input.modelo),
      model: input.modelo.trim() || 'Modelo',
      year: carYear,
      fuel: 'Não informado',
      dataOrigin: 'simulated',
    },
    fipeValue: null,
    fines,
    ipva,
    licensing,
    totalFinesPending: 0,
    totalFinesPendingValue: 0,
  });
}

/**
 * Consulta principal: backend opcional → híbrido (BrasilAPI placa + FIPE + simulações) → mock.
 */
export async function getVehicleRecord(input: VehicleRecordInput): Promise<VehicleRecordQueryResult> {
  const realData = await fetchRealVehicleData(input.placa);
  if (realData) {
    return { record: realData, source: 'api' };
  }

  const plateApi = await fetchBrasilApiPlaca(input.placa);
  const brandFromApi = plateApi?.marca?.trim();
  const modelFromApi = plateApi?.modelo?.trim();
  const yearFromApi = plateApi?.ano ?? plateApi?.anoModelo;
  const yearNum = Number(yearFromApi) || parseInt(input.ano, 10) || new Date().getFullYear();
  const brand = brandFromApi || inferBrandFromModel(input.modelo);
  const model = modelFromApi || input.modelo.trim();
  const fuel = plateApi?.combustivel?.trim() || 'Gasolina';

  const vehicleBlock: VehicleInfoBlock = {
    brand,
    model: model || 'Modelo',
    year: yearNum,
    fuel,
    dataOrigin: plateApi?.marca ? 'api' : 'cadastro',
  };

  if (!model || !input.ano) {
    return { record: generateMockVehicleData(input), source: 'mock' };
  }

  const fipe = await fetchFipeVehiclePrice({
    brandHint: brand,
    modelHint: model,
    year: yearNum,
    tipo: input.tipo,
  });

  if (!fipe) {
    return { record: generateMockVehicleData(input), source: 'mock' };
  }

  const record = buildHybridRecord(input, {
    vehicleBlock: {
      ...vehicleBlock,
      year: fipe.modelYear || yearNum,
      fuel: fipe.fuel || fuel,
    },
    fipeValue: fipe.priceNumber,
  });

  return { record, source: 'hybrid' };
}
