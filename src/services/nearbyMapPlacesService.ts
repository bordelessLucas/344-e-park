/**
 * Postos de combustível e carregadores próximos para o mapa.
 * 1) Google Places (se chave configurada): postos + recarga elétrica.
 * 2) OpenStreetMap via Overpass API — dados reais, sem chave (uso moderado).
 *    Vários espelhos Overpass como fallback se um estiver indisponível.
 */

import { isGooglePlacesConfigured, getGooglePlacesApiKey } from '../config/appConfig';

export type NearbyMapPlaceKind = 'fuel' | 'ev' | 'both';

export type NearbyMapStation = {
  name: string;
  vicinity: string;
  geometry: { location: { lat: number; lng: number } };
  source: 'google' | 'osm';
  /** Origem semântica do POI (combustível, elétrico ou ambos no mesmo ponto). */
  kind: NearbyMapPlaceKind;
};

type NearbyMapResult = {
  stations: NearbyMapStation[];
  source: 'google' | 'osm';
};

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
] as const;

interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements?: OverpassElement[];
}

function googleKindFromTypes(types: unknown): NearbyMapPlaceKind {
  if (!Array.isArray(types)) return 'fuel';
  const t = new Set(types.map((x) => String(x).toLowerCase()));
  const ev = t.has('electric_vehicle_charging_station');
  const gas = t.has('gas_station');
  if (ev && gas) return 'both';
  if (ev) return 'ev';
  return 'fuel';
}

function normalizeGoogleResults(results: unknown[], defaultKind: NearbyMapPlaceKind): NearbyMapStation[] {
  const out: NearbyMapStation[] = [];
  for (const r of results) {
    const row = r as {
      name?: string;
      vicinity?: string;
      types?: string[];
      geometry?: { location?: { lat?: number; lng?: number } };
    };
    const lat = row.geometry?.location?.lat;
    const lng = row.geometry?.location?.lng;
    if (lat == null || lng == null) continue;
    const kind = row.types?.length ? googleKindFromTypes(row.types) : defaultKind;
    const isEv = kind === 'ev' || kind === 'both';
    const isFuel = kind === 'fuel' || kind === 'both';
    const fallbackName = isEv && !isFuel ? 'Recarga elétrica' : isFuel && !isEv ? 'Posto' : 'Posto / recarga';
    out.push({
      name: row.name ?? fallbackName,
      vicinity: row.vicinity ?? '',
      geometry: { location: { lat, lng } },
      source: 'google',
      kind,
    });
  }
  return out;
}

function overpassElementToPlace(el: OverpassElement): NearbyMapStation | null {
  const lat = el.lat ?? el.center?.lat;
  const lon = el.lon ?? el.center?.lon;
  if (lat == null || lon == null || Number.isNaN(lat) || Number.isNaN(lon)) {
    return null;
  }
  const tags = el.tags ?? {};
  const amenity = tags.amenity;
  const isCharging = amenity === 'charging_station';
  const kind: NearbyMapPlaceKind = isCharging ? 'ev' : 'fuel';
  const name =
    tags.name ||
    tags.brand ||
    tags.operator ||
    (isCharging ? 'Ponto de recarga' : 'Posto de combustível');
  const street = tags['addr:street'] || tags['addr:full'] || '';
  const city = tags['addr:city'] || tags['addr:municipality'] || '';
  const vicinity = [street, city].filter(Boolean).join(' · ') || 'Dados: OpenStreetMap';
  return {
    name,
    vicinity,
    geometry: { location: { lat, lng: lon } },
    source: 'osm',
    kind,
  };
}

function mergeKinds(a: NearbyMapPlaceKind, b: NearbyMapPlaceKind): NearbyMapPlaceKind {
  if (a === b) return a;
  if (a === 'both' || b === 'both') return 'both';
  if ((a === 'fuel' && b === 'ev') || (a === 'ev' && b === 'fuel')) return 'both';
  return a;
}

function dedupeStations(places: NearbyMapStation[], max: number): NearbyMapStation[] {
  const byCoord = new Map<string, NearbyMapStation>();
  for (const p of places) {
    const key = `${p.geometry.location.lat.toFixed(4)}_${p.geometry.location.lng.toFixed(4)}`;
    const prev = byCoord.get(key);
    if (!prev) {
      byCoord.set(key, p);
      continue;
    }
    byCoord.set(key, {
      ...prev,
      kind: mergeKinds(prev.kind, p.kind),
      name: prev.name.length >= p.name.length ? prev.name : p.name,
      vicinity:
        prev.vicinity && p.vicinity && prev.vicinity !== p.vicinity
          ? `${prev.vicinity} · ${p.vicinity}`
          : prev.vicinity || p.vicinity,
    });
  }
  const merged = [...byCoord.values()];
  const seen = new Set<string>();
  const out: NearbyMapStation[] = [];
  for (const p of merged) {
    const key = `${p.geometry.location.lat.toFixed(4)}_${p.geometry.location.lng.toFixed(4)}_${p.name.slice(0, 40)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
    if (out.length >= max) break;
  }
  return out;
}

async function fetchNearbyFromOverpass(lat: number, lng: number, radiusM: number): Promise<NearbyMapStation[]> {
  const q = `
[out:json][timeout:25];
(
  node["amenity"="fuel"](around:${radiusM},${lat},${lng});
  way["amenity"="fuel"](around:${radiusM},${lat},${lng});
  node["amenity"="charging_station"](around:${radiusM},${lat},${lng});
  way["amenity"="charging_station"](around:${radiusM},${lat},${lng});
);
out center;
`.trim();

  const body = `data=${encodeURIComponent(q)}`;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'E-Park/1.0 (Expo; combustível/recarga próximos)',
        },
        body,
      });

      if (!res.ok) {
        continue;
      }

      const json = (await res.json()) as OverpassResponse;
      const elements = json.elements ?? [];
      const raw: NearbyMapStation[] = [];
      for (const el of elements) {
        const p = overpassElementToPlace(el);
        if (p) raw.push(p);
      }
      const list = dedupeStations(raw, 28);
      if (list.length > 0) {
        return list;
      }
    } catch {
      /* tenta próximo espelho */
    }
  }
  return [];
}

async function fetchNearbyFromGoogleType(
  lat: number,
  lng: number,
  radius: number,
  placeType: 'gas_station' | 'electric_vehicle_charging_station',
): Promise<NearbyMapStation[]> {
  const key = getGooglePlacesApiKey();
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${placeType}&key=${encodeURIComponent(key)}`;
  const defaultKind: NearbyMapPlaceKind = placeType === 'electric_vehicle_charging_station' ? 'ev' : 'fuel';
  try {
    const response = await fetch(url);
    const data = (await response.json()) as { status?: string; results?: unknown[] };
    if (data.status === 'OK' && Array.isArray(data.results) && data.results.length > 0) {
      return normalizeGoogleResults(data.results, defaultKind);
    }
    return [];
  } catch {
    return [];
  }
}

async function fetchNearbyFromGoogle(lat: number, lng: number, radius: number): Promise<NearbyMapStation[]> {
  const [gas, ev] = await Promise.all([
    fetchNearbyFromGoogleType(lat, lng, radius, 'gas_station'),
    fetchNearbyFromGoogleType(lat, lng, radius, 'electric_vehicle_charging_station'),
  ]);
  return dedupeStations([...gas, ...ev], 36);
}

/**
 * Retorna pontos reais próximos ao usuário para o mapa (Google ou OSM).
 */
export async function fetchNearbyMapStations(
  lat: number,
  lng: number,
  radiusMeters: number = 5000,
): Promise<NearbyMapResult> {
  if (isGooglePlacesConfigured()) {
    const google = await fetchNearbyFromGoogle(lat, lng, radiusMeters);
    if (google.length > 0) {
      return { stations: google.slice(0, 32), source: 'google' };
    }
  }

  const osm = await fetchNearbyFromOverpass(lat, lng, radiusMeters);
  return { stations: osm, source: 'osm' };
}
