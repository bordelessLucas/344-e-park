/**
 * Geocodificação reversa gratuita (Photon / Komoot, dados OSM).
 * https://photon.komoot.io — sem chave; use com moderação.
 */

export type PhotonReverseResult = {
  /** Linha curta para exibir ao usuário (bairro / cidade). */
  label: string;
};

function pickPhotonLabel(props: Record<string, unknown>): string | null {
  const city = typeof props.city === 'string' ? props.city : '';
  const district = typeof props.district === 'string' ? props.district : '';
  const locality = typeof props.locality === 'string' ? props.locality : '';
  const name = typeof props.name === 'string' ? props.name : '';
  const street = typeof props.street === 'string' ? props.street : '';
  const state = typeof props.state === 'string' ? props.state : '';

  const area = district || locality || name;
  const line1 = [area, city].filter(Boolean).join(', ');
  if (line1) {
    return state ? `${line1} · ${state}` : line1;
  }
  if (street && city) return `${street}, ${city}`;
  if (city) return city;
  return null;
}

/**
 * Retorna um rótulo legível da posição (bairro/cidade) ou null se falhar.
 */
export async function fetchPhotonReverseGeocode(lat: number, lng: number): Promise<PhotonReverseResult | null> {
  try {
    const url = `https://photon.komoot.io/reverse?lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lng))}&lang=pt`;
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'E-Park/1.0 (Expo; geocodificação reversa)',
      },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { features?: Array<{ properties?: Record<string, unknown> }> };
    const props = data.features?.[0]?.properties;
    if (!props) return null;
    const label = pickPhotonLabel(props);
    return label ? { label } : null;
  } catch {
    return null;
  }
}
