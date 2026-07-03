import type { IPet, StrapiCollectionResponse } from '../types/strapi';

const STRAPI_URL = import.meta.env.PUBLIC_STRAPI_URL ?? 'http://localhost:1337';
const STRAPI_TOKEN = import.meta.env.STRAPI_API_TOKEN ?? '';
const STRAPI_REQUEST_TOKEN = import.meta.env.STRAPI_REQUEST_TOKEN ?? STRAPI_TOKEN;

if (!import.meta.env.PUBLIC_STRAPI_URL || !import.meta.env.STRAPI_API_TOKEN) {
  console.warn('⚠️ Advertencia: PUBLIC_STRAPI_URL o STRAPI_API_TOKEN no están definidos en el archivo .env. Usando valores por defecto para desarrollo.');
}

interface FetchOptions extends RequestInit {
  query?: Record<string, string>;
}

/**
 * Utilidad nativa de fetch para Strapi 5
 * @param endpoint Ruta de la API (ej: 'homepage' o 'noticias')
 * @param options Opciones de configuración y query parameters
 */
export async function strapiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { query, ...customOptions } = options;

  // Construcción limpia de la URL de la API
  const url = new URL(`/api/${endpoint}`, STRAPI_URL);
  if (query) {
    Object.entries(query).forEach(([key, value]) => url.searchParams.append(key, value));
  }

  const headers = new Headers({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${STRAPI_TOKEN}`,
    ...customOptions.headers,
  });

  const response = await fetch(url.toString(), {
    ...customOptions,
    headers,
  });

  if (!response.ok) {
    throw new Error(`[Strapi Fetch Error] Estado: ${response.status} - ${response.statusText}`);
  }

  return await response.json() as T;
}

async function strapiPost<T>(endpoint: string, data: unknown): Promise<T> {
  const url = new URL(`/api/${endpoint}`, STRAPI_URL);

  const headers = new Headers({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${STRAPI_REQUEST_TOKEN}`,
  });

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers,
    body: JSON.stringify({ data }),
  });

  if (!response.ok) {
    const rawError = await response.text();
    throw new Error(rawError || `[Strapi Post Error] Estado: ${response.status}`);
  }

  return await response.json() as T;
}

function normalizeMediaUrl(url?: string | null): string | undefined {
  if (!url) {
    return undefined;
  }

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  if (!STRAPI_URL) {
    return url;
  }

  const base = STRAPI_URL.endsWith('/') ? STRAPI_URL : `${STRAPI_URL}/`;
  return new URL(url.replace(/^\//, ''), base).toString();
}

function normalizePetMedia(item: any): IPet {
  const raw = item?.attributes ? item.attributes : item;
  const photoItems = raw?.photos?.data ?? raw?.photos ?? [];
  const photos = Array.isArray(photoItems)
    ? photoItems.map((photo: any) => {
        const photoAttrs = photo?.attributes ? photo.attributes : photo;
        return {
          id: photo?.id ?? photoAttrs?.id,
          url: normalizeMediaUrl(photoAttrs?.url) ?? photoAttrs?.url,
          alternativeText: photoAttrs?.alternativeText ?? photoAttrs?.alternative_text ?? null,
        };
      })
    : [];

  return {
    id: item?.id ?? raw?.id,
    documentId: raw?.documentId ?? raw?.document_id ?? '',
    name: raw?.name ?? '',
    description: raw?.description ?? '',
    species: raw?.species ?? 'perro',
    ageGroup: raw?.ageGroup ?? raw?.age_group ?? 'adulto',
    gender: raw?.gender ?? raw?.sexo ?? 'macho',
    size: raw?.size ?? raw?.tamano ?? 'mediano',
    isAdopted: raw?.isAdopted ?? raw?.is_adopted ?? false,
    adoptedDated: raw?.adoptedDated ?? raw?.adopted_dated ?? null,
    estadoInventario: raw?.estadoInventario ?? raw?.estado_inventario ?? undefined,
    validadoInventario: raw?.validadoInventario ?? raw?.validado_inventario ?? false,
    notasInventario: raw?.notasInventario ?? raw?.notas_inventario ?? null,
    photos,
    createdAt: raw?.createdAt ?? raw?.created_at ?? '',
    updatedAt: raw?.updatedAt ?? raw?.updated_at ?? '',
    publishedAt: raw?.publishedAt ?? raw?.published_at ?? '',
  };
}

export async function getAvailablePets(): Promise<StrapiCollectionResponse<IPet>> {
  const response = await strapiFetch<StrapiCollectionResponse<any>>(
    'pets?populate[photos][fields]=url,alternativeText&sort=publishedAt:desc'
  );

  return {
    ...response,
    data: response.data.map(normalizePetMedia),
  };
}

export async function getPetByDocumentId(documentId: string): Promise<StrapiCollectionResponse<IPet>> {
  const response = await strapiFetch<StrapiCollectionResponse<IPet>>(
    `pets?filters[documentId][$eq]=${encodeURIComponent(documentId)}&populate[photos][fields]=url,alternativeText`
  );

  return {
    ...response,
    data: response.data.map(normalizePetMedia),
  };
}

interface CreateAdoptionRequestInput {
  pet: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  neighborhood: string;
  age: number;
  adoptionReason: string;
}

interface CreateSponsorRequestInput {
  pet: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  monthlyAmount: number;
}

interface StrapiCollectionMinimal<T> {
  data: T[];
}

interface StrapiEntityWithDocumentId {
  documentId: string;
}

interface RequestResult {
  success: boolean;
  message: string;
}

export async function createAdoptionRequest(data: CreateAdoptionRequestInput): Promise<RequestResult> {
  try {
    const adopterResponse = await strapiFetch<StrapiCollectionMinimal<StrapiEntityWithDocumentId>>(
      `adopters?filters[email][$eq]=${encodeURIComponent(data.email)}`
    );

    let adopterDocumentId = adopterResponse.data[0]?.documentId;
    if (!adopterDocumentId) {
      const created = await strapiPost<{ data: StrapiEntityWithDocumentId }>('adopters', {
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        neighborhood: data.neighborhood,
        age: data.age,
      });
      adopterDocumentId = created.data.documentId;
    }

    await strapiPost('adoption-requests', {
      pet: data.pet,
      adopter: adopterDocumentId,
      adoptionReason: data.adoptionReason,
    });

    return {
      success: true,
      message: 'Solicitud enviada con exito. Te contactaremos en un plazo maximo de 48 horas.',
    };
  } catch (error) {
    console.error('Error creating adoption request:', error);
    return {
      success: false,
      message: 'No fue posible enviar la solicitud de adopcion. Intenta nuevamente.',
    };
  }
}

export async function createSponsorRequest(data: CreateSponsorRequestInput): Promise<RequestResult> {
  try {
    const sponsorResponse = await strapiFetch<StrapiCollectionMinimal<StrapiEntityWithDocumentId>>(
      `sponsors?filters[email][$eq]=${encodeURIComponent(data.email)}`
    );

    let sponsorDocumentId = sponsorResponse.data[0]?.documentId;
    if (!sponsorDocumentId) {
      const created = await strapiPost<{ data: StrapiEntityWithDocumentId }>('sponsors', {
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
      });
      sponsorDocumentId = created.data.documentId;
    }

    await strapiPost('sponsor-requests', {
      pet: data.pet,
      sponsor: sponsorDocumentId,
      monthlyAmount: data.monthlyAmount,
    });

    return {
      success: true,
      message: 'Solicitud de apadrinamiento enviada con exito. Te contactaremos pronto.',
    };
  } catch (error) {
    console.error('Error creating sponsor request:', error);
    return {
      success: false,
      message: 'No fue posible enviar la solicitud de apadrinamiento. Intenta nuevamente.',
    };
  }
}