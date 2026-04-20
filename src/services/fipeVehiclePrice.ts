/**
 * Consulta valor FIPE (API pública parallelum) a partir de marca/modelo/ano/tipo.
 * Mesma família de endpoints usada em MarketValue.
 */

export interface FipePriceResult {
  priceNumber: number;
  priceFormatted: string;
  brand: string;
  model: string;
  modelYear: number;
  fuel: string;
}

interface FipeBrand {
  code: string;
  name: string;
}

interface FipeModel {
  code: string;
  name: string;
}

interface FipeYear {
  code: string;
  name: string;
}

interface FipePrice {
  price: string;
  brand: string;
  model: string;
  modelYear: number;
  fuel: string;
}

const FIPE_BASE = 'https://fipe.parallelum.com.br/api/v2';

function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function extractYear(yearString: string): number {
  const match = yearString.match(/^(\d{4})/);
  return match ? parseInt(match[1], 10) : 0;
}

function fipeVehiclePath(tipo: string): 'cars' | 'motorcycles' | 'trucks' {
  if (tipo === 'Motocicleta') return 'motorcycles';
  if (tipo === 'Caminhão/Ônibus') return 'trucks';
  return 'cars';
}

export async function fetchFipeVehiclePrice(params: {
  brandHint: string;
  modelHint: string;
  year: number;
  tipo: string;
}): Promise<FipePriceResult | null> {
  const { brandHint, modelHint, year, tipo } = params;
  const vehiclePath = fipeVehiclePath(tipo);

  try {
    const brandsResponse = await fetch(`${FIPE_BASE}/${vehiclePath}/brands`);
    if (!brandsResponse.ok) return null;
    const brands: FipeBrand[] = await brandsResponse.json();
    if (!brands || brands.length === 0) return null;

    const commonBrands = [
      'Fiat',
      'Volkswagen',
      'Chevrolet',
      'Ford',
      'Toyota',
      'Honda',
      'Renault',
      'Hyundai',
      'Nissan',
      'Peugeot',
    ];
    const sortedBrands = [
      ...brands.filter((b) => commonBrands.some((cb) => normalizeString(b.name).includes(normalizeString(cb)))),
      ...brands.filter((b) => !commonBrands.some((cb) => normalizeString(b.name).includes(normalizeString(cb)))),
    ];

    const brandNorm = normalizeString(brandHint);
    const preferredBrand =
      brandNorm.length > 0
        ? sortedBrands.find((b) => normalizeString(b.name) === brandNorm) ??
          sortedBrands.find(
            (b) => normalizeString(b.name).includes(brandNorm) || brandNorm.includes(normalizeString(b.name))
          )
        : undefined;

    const brandList = preferredBrand
      ? [preferredBrand, ...sortedBrands.filter((b) => b.code !== preferredBrand.code)]
      : sortedBrands;

    for (const brand of brandList) {
      try {
        const modelsResponse = await fetch(`${FIPE_BASE}/${vehiclePath}/brands/${brand.code}/models`);
        if (!modelsResponse.ok) continue;
        const models: FipeModel[] = await modelsResponse.json();
        if (!models || models.length === 0) continue;

        const vehicleModelNormalized = normalizeString(modelHint);
        const brandNameNormalized = normalizeString(brand.name);
        const commonWords = ['de', 'do', 'da', 'dos', 'das', 'e', 'a', 'o', 'el', 'le', 'la'];

        let searchModel = vehicleModelNormalized;
        if (searchModel.startsWith(brandNameNormalized)) {
          searchModel = searchModel.substring(brandNameNormalized.length).trim();
        }

        const searchWords = searchModel.split(/\s+/).filter((w) => w.length > 1 && !commonWords.includes(w));

        let matchingModel = models.find((model) => {
          const modelNormalized = normalizeString(model.name);
          let modelWithoutBrand = modelNormalized;
          if (modelNormalized.startsWith(brandNameNormalized)) {
            modelWithoutBrand = modelNormalized.substring(brandNameNormalized.length).trim();
          }
          if (modelWithoutBrand === searchModel || modelNormalized === vehicleModelNormalized) return true;
          if (modelWithoutBrand.includes(searchModel) || searchModel.includes(modelWithoutBrand)) return true;
          return false;
        });

        if (!matchingModel && searchWords.length > 0) {
          matchingModel = models.find((model) => {
            const modelNormalized = normalizeString(model.name);
            let modelWithoutBrand = modelNormalized;
            if (modelNormalized.startsWith(brandNameNormalized)) {
              modelWithoutBrand = modelNormalized.substring(brandNameNormalized.length).trim();
            }
            const modelWords = modelWithoutBrand.split(/\s+/).filter((w) => w.length > 1);
            return searchWords.every((searchWord) =>
              modelWords.some((modelWord) => modelWord.includes(searchWord) || searchWord.includes(modelWord) || modelWord === searchWord)
            );
          });
        }

        if (!matchingModel && searchWords.length > 0) {
          const mainWord = searchWords[searchWords.length - 1];
          matchingModel = models.find((model) => {
            const modelNormalized = normalizeString(model.name);
            let modelWithoutBrand = modelNormalized;
            if (modelNormalized.startsWith(brandNameNormalized)) {
              modelWithoutBrand = modelNormalized.substring(brandNameNormalized.length).trim();
            }
            return modelWithoutBrand.includes(mainWord) || mainWord.includes(modelWithoutBrand);
          });
        }

        if (!matchingModel) continue;

        const yearsResponse = await fetch(
          `${FIPE_BASE}/${vehiclePath}/brands/${brand.code}/models/${matchingModel.code}/years`
        );
        if (!yearsResponse.ok) continue;
        const years: FipeYear[] = await yearsResponse.json();
        if (!years || years.length === 0) continue;

        const yearsWithDiff = years
          .map((y) => {
            const yearNum = extractYear(y.name);
            return { year: y, yearNum, diff: Math.abs(yearNum - year) };
          })
          .filter((item) => item.yearNum > 0);

        if (yearsWithDiff.length === 0) continue;

        yearsWithDiff.sort((a, b) => {
          if (a.yearNum === year) return -1;
          if (b.yearNum === year) return 1;
          return a.diff - b.diff;
        });

        const selectedYear = yearsWithDiff[0].year;

        const priceResponse = await fetch(
          `${FIPE_BASE}/${vehiclePath}/brands/${brand.code}/models/${matchingModel.code}/years/${selectedYear.code}`
        );
        if (!priceResponse.ok) continue;
        const priceData: FipePrice = await priceResponse.json();

        const priceString = priceData.price.replace(/[^\d,]/g, '').replace(',', '.');
        const priceNumber = parseFloat(priceString);
        if (Number.isNaN(priceNumber) || priceNumber <= 0) continue;

        return {
          priceNumber,
          priceFormatted: priceData.price,
          brand: priceData.brand,
          model: priceData.model,
          modelYear: priceData.modelYear,
          fuel: priceData.fuel,
        };
      } catch {
        continue;
      }
    }

    return null;
  } catch {
    return null;
  }
}

export { normalizeString };
