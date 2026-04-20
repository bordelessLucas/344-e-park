/**
 * Preços regionais de combustível via API pública (fonte agregada: Petrobras).
 * Documentação: https://combustivelapi.com.br/
 * Endpoint público: GET https://combustivelapi.com.br/api/precos
 *
 * Observação: a API retorna média por UF (gasolina e diesel). Etanol não vem na
 * resposta; usamos proporção típica em relação à gasolina no RS (ANP/LPC ~72–78%).
 */

import type { FuelStation } from '../types/fuelStation';

const API_URL = 'https://combustivelapi.com.br/api/precos';

export interface FuelPriceApiResponse {
  error: boolean;
  message: string;
  data_coleta: string;
  fonte?: string;
  moeda?: string;
  precos: {
    gasolina: Record<string, string>;
    diesel: Record<string, string>;
    /** Se a API passar a expor etanol por UF, usamos o valor oficial. */
    etanol?: Record<string, string>;
  };
}

export interface RegionalFuelPrices {
  uf: string;
  gasoline: number;
  diesel: number;
  /** Quando a API não envia etanol, derivamos da gasolina com proporção típica LPC por UF. */
  ethanolEstimated: boolean;
  ethanol: number;
  collectedAt: string;
  sourceLabel: string;
}

/** Converte string brasileira "6,62" para número. */
export function parseBrPrice(value: string | undefined): number | null {
  if (value == null || value === '') return null;
  const n = parseFloat(String(value).trim().replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

/** Cidades do app → UF (todas no Rio Grande do Sul). */
const CITY_TO_UF: Record<string, string> = {
  'Porto Alegre': 'rs',
  Canoas: 'rs',
  Esteio: 'rs',
};

export function cityToUf(city: string): string {
  return CITY_TO_UF[city] ?? 'rs';
}

/**
 * Proporção etanol/gasolina quando a API não informa etanol (médias históricas LPC por UF).
 * RS: forte presença de etanol; proporções típicas ~0,72–0,76.
 */
const ETHANOL_TO_GASOLINE_BY_UF: Record<string, number> = {
  rs: 0.752,
  sp: 0.718,
  pr: 0.738,
  sc: 0.745,
  mg: 0.728,
  rj: 0.722,
  go: 0.768,
  mt: 0.762,
  ms: 0.758,
  ba: 0.748,
  pe: 0.72,
  ce: 0.732,
  pa: 0.775,
  am: 0.71,
  df: 0.715,
  es: 0.735,
  ma: 0.74,
  pb: 0.725,
  al: 0.718,
};

const ETHANOL_TO_GASOLINE_DEFAULT = 0.738;

export async function fetchRegionalFuelPrices(city: string): Promise<RegionalFuelPrices | null> {
  const uf = cityToUf(city);

  try {
    const res = await fetch(API_URL, { method: 'GET' });
    if (!res.ok) return null;
    const json = (await res.json()) as FuelPriceApiResponse;
    if (json.error || !json.precos) return null;

    const gasStr = json.precos.gasolina[uf] ?? json.precos.gasolina['br'];
    const dieStr = json.precos.diesel[uf] ?? json.precos.diesel['br'];

    const gasoline = parseBrPrice(gasStr);
    const diesel = parseBrPrice(dieStr);
    if (gasoline == null || diesel == null) return null;

    const etanolMap = json.precos.etanol;
    const ethFromApi =
      etanolMap != null ? parseBrPrice(etanolMap[uf] ?? etanolMap['br']) : null;

    let ethanol: number;
    let ethanolEstimated: boolean;
    if (ethFromApi != null) {
      ethanol = ethFromApi;
      ethanolEstimated = false;
    } else {
      const ratio = ETHANOL_TO_GASOLINE_BY_UF[uf] ?? ETHANOL_TO_GASOLINE_DEFAULT;
      ethanol = gasoline * ratio;
      ethanolEstimated = true;
    }

    return {
      uf,
      gasoline,
      diesel,
      ethanol,
      ethanolEstimated,
      collectedAt: json.data_coleta ?? '',
      sourceLabel: json.fonte ?? 'Petrobras / combustivelapi.com.br',
    };
  } catch {
    return null;
  }
}

/** Substitui gasolina/diesel/etanol pelos valores regionais da API. kWh é ajustado em `applyChargingPriceEstimate`. */
export function applyRegionalPricesToStation(
  station: FuelStation,
  regional: RegionalFuelPrices | null
): FuelStation['prices'] | undefined {
  if (!regional || !station.prices) {
    return station.prices;
  }
  const p = station.prices;
  const hasLiquid = p.gasoline != null || p.ethanol != null || p.diesel != null;
  if (!hasLiquid) {
    return p;
  }
  return {
    ...p,
    gasoline: regional.gasoline,
    diesel: regional.diesel,
    ethanol: regional.ethanol,
  };
}
