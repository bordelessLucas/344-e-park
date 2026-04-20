/**
 * Referência de preço público por kWh no Brasil (faixas típicas de mercado,
 * conforme potência do equipamento). Não substitui a tarifa da operadora no local.
 */

import type { FuelStation } from '../types/fuelStation';

export function parseChargingPowerKw(chargingPower?: string): number | null {
  if (chargingPower == null || chargingPower === '') return null;
  const m = String(chargingPower).match(/(\d+(?:\.\d+)?)\s*k?\s*w/i);
  if (!m) return null;
  const n = parseFloat(m[1]);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Estimativa por faixa de potência (R$/kWh), alinhada a faixas usuais de redes
 * públicas no BR (AC em shopping vs DC rápido/ultrarrápido).
 */
export function estimatePublicChargingPricePerKwh(kw: number | null): number {
  if (kw == null) {
    return 2.05;
  }
  if (kw <= 22) {
    return 1.22;
  }
  if (kw <= 50) {
    return 1.92;
  }
  if (kw <= 100) {
    return 2.28;
  }
  if (kw <= 150) {
    return 2.82;
  }
  return 3.1;
}

/** Aplica referência de kWh a postos elétricos ou híbridos (preserva combustível da API). */
export function applyChargingPriceEstimate(
  station: FuelStation,
  prices: FuelStation['prices'] | undefined,
): FuelStation['prices'] | undefined {
  if (!prices) return prices;
  if (station.type !== 'electric' && station.type !== 'both') {
    return prices;
  }
  const kw = parseChargingPowerKw(station.chargingPower);
  const charging = estimatePublicChargingPricePerKwh(kw);
  return { ...prices, charging };
}
