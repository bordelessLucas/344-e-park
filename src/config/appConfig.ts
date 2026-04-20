import Constants from 'expo-constants';

/**
 * Chave da API Google Places (Nearby Search).
 * Defina EXPO_PUBLIC_GOOGLE_PLACES_API_KEY no .env ou `expo.extra.googlePlacesApiKey` no app.json.
 */
export function getGooglePlacesApiKey(): string {
  const fromEnv = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;
  if (typeof fromEnv === 'string' && fromEnv.trim().length > 0) {
    return fromEnv.trim();
  }
  const extra = Constants.expoConfig?.extra as Record<string, unknown> | undefined;
  const fromExtra = extra?.googlePlacesApiKey;
  if (typeof fromExtra === 'string' && fromExtra.trim().length > 0) {
    return fromExtra.trim();
  }
  return '';
}

export function isGooglePlacesConfigured(): boolean {
  const k = getGooglePlacesApiKey();
  if (k.length === 0) return false;
  const lower = k.toLowerCase();
  return !lower.includes('sua_chave') && !lower.includes('placeholder') && !lower.includes('xxxxx');
}

/** URL opcional (JSON) com catálogo de baterias — mesmo formato que `BatteryProduct[]`. */
/**
 * Base URL do **seu backend** que consulta DETRAN/SEFAZ ou parceiro homologado.
 * Não use o URL do portal .xhtml do governo como “API” — o app chama JSON REST aqui.
 */
export function getVehicleInfoApiBase(): string {
  const fromEnv = process.env.EXPO_PUBLIC_VEHICLE_INFO_API_BASE;
  if (typeof fromEnv === 'string' && fromEnv.trim().startsWith('http')) {
    return fromEnv.trim().replace(/\/$/, '');
  }
  const extra = Constants.expoConfig?.extra as Record<string, unknown> | undefined;
  const u = extra?.vehicleInfoApiBase;
  if (typeof u === 'string' && u.trim().startsWith('http')) {
    return u.trim().replace(/\/$/, '');
  }
  return '';
}

export function getVehicleInfoApiKey(): string {
  const fromEnv = process.env.EXPO_PUBLIC_VEHICLE_INFO_API_KEY;
  if (typeof fromEnv === 'string' && fromEnv.trim().length > 0) {
    return fromEnv.trim();
  }
  const extra = Constants.expoConfig?.extra as Record<string, unknown> | undefined;
  const k = extra?.vehicleInfoApiKey;
  if (typeof k === 'string' && k.trim().length > 0) {
    return k.trim();
  }
  return '';
}

/** Base + chave (recomendado para produção). */
export function isVehicleInfoApiConfigured(): boolean {
  const base = getVehicleInfoApiBase();
  const key = getVehicleInfoApiKey();
  if (!base || !key) return false;
  const lower = key.toLowerCase();
  if (lower.includes('placeholder') || lower.includes('xxxxx')) return false;
  return true;
}

export function getBatteryCatalogUrl(): string | null {
  const fromEnv = process.env.EXPO_PUBLIC_BATTERY_CATALOG_URL;
  if (typeof fromEnv === 'string' && fromEnv.trim().startsWith('http')) {
    return fromEnv.trim();
  }
  const extra = Constants.expoConfig?.extra as Record<string, unknown> | undefined;
  const u = extra?.batteryCatalogUrl;
  if (typeof u === 'string' && u.trim().startsWith('http')) {
    return u.trim();
  }
  return null;
}
