import type { IPet, INoticia, IProducto, StrapiCollectionResponse, StrapiSingleResponse } from '../types/strapi';
import { optimizeCloudinaryImage } from './cloudinary';

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

function normalizePetMedia(item: any, photoWidth?: number): IPet {
  const raw = item?.attributes ? item.attributes : item;
  const photoItems = raw?.photos?.data ?? raw?.photos ?? [];
  const photos = Array.isArray(photoItems)
    ? photoItems.map((photo: any) => {
        const photoAttrs = photo?.attributes ? photo.attributes : photo;
        const url = normalizeMediaUrl(photoAttrs?.url) ?? photoAttrs?.url;
        return {
          id: photo?.id ?? photoAttrs?.id,
          url: photoWidth ? optimizeCloudinaryImage(url, photoWidth) : url,
          alternativeText: photoAttrs?.alternativeText ?? photoAttrs?.alternative_text ?? null,
        };
      })
    : [];

  return {
    id: item?.id ?? raw?.id,
    documentId: raw?.documentId ?? raw?.document_id ?? '',
    name: raw?.name ?? '',
    description: raw?.description ?? '',
    species: raw?.species ?? 'Perro',
    ageGroup: raw?.ageGroup ?? raw?.age_group ?? 'adulto',
    gender: raw?.gender ?? raw?.sexo ?? 'Macho',
    size: raw?.size ?? raw?.tamano ?? 'Mediano',
    convivencia: raw?.convivencia ?? 'Solo',
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
    'pets?filters[isAdopted][$eq]=false&populate[photos][fields]=url,alternativeText&sort=publishedAt:desc'
  );

  return {
    ...response,
    data: response.data.map((item: any) => normalizePetMedia(item, 500)),
  };
}

export async function getPetByDocumentId(documentId: string): Promise<StrapiCollectionResponse<IPet>> {
  const response = await strapiFetch<StrapiCollectionResponse<IPet>>(
    `pets?filters[documentId][$eq]=${encodeURIComponent(documentId)}&populate[photos][fields]=url,alternativeText`
  );

  return {
    ...response,
    data: response.data.map((item: any) => normalizePetMedia(item, 800)),
  }
}

export async function getHappyEndings(limit: number = 6): Promise<IPet[]> {
  try {
    const response = await strapiFetch<StrapiCollectionResponse<any>>(
      `pets?filters[isAdopted][$eq]=true&filters[adoptedDated][$notNull]=true&populate[photos][fields]=url,alternativeText&sort=adoptedDated:desc&pagination[limit]=${limit}`
    );
    return (response?.data ?? []).map((item: any) => normalizePetMedia(item, 500));
  } catch {
    return [];
  }
}

export interface IFaq {
  titulo: string;
  preguntas: Array<{ pregunta: string; respuesta: string }>;
}

export async function getFAQ(): Promise<IFaq | null> {
  try {
    const response = await strapiFetch<StrapiSingleResponse<IFaq>>(
      'faq?populate[preguntas][fields]=pregunta,respuesta&fields=titulo'
    );
    return response?.data ?? null;
  } catch {
    return null;
  }
}

function normalizeNoticiaMedia(item: any, imageWidth?: number): INoticia {
  const raw = item?.attributes ? item.attributes : item;
  const imgRaw = raw?.imagen?.data ?? raw?.imagen;
  const img = imgRaw && (imgRaw.attributes ?? imgRaw);
  const imgUrl = img && img.url ? (normalizeMediaUrl(img.url) ?? img.url) : null;

  return {
    id: item?.id ?? raw?.id,
    documentId: raw?.documentId ?? raw?.document_id ?? '',
    titulo: raw?.titulo ?? raw?.title ?? '',
    slug: raw?.slug ?? '',
    resumen: raw?.resumen ?? raw?.description ?? '',
    contenido: raw?.contenido ?? raw?.content ?? '',
    fecha: raw?.fecha ?? raw?.publishedAtDate ?? '',
    imagen: img && imgUrl
      ? { id: img.id, url: imageWidth ? optimizeCloudinaryImage(imgUrl, imageWidth) : imgUrl, alternativeText: img.alternativeText ?? null }
      : null,
    createdAt: raw?.createdAt ?? '',
    updatedAt: raw?.updatedAt ?? '',
    publishedAt: raw?.publishedAt ?? '',
  };
}

export async function getNoticias(): Promise<INoticia[]> {
  try {
    const response = await strapiFetch<StrapiCollectionResponse<any>>(
      'noticias?populate=imagen&fields=titulo,slug,resumen,contenido,fecha&sort=fecha:desc'
    );
    return (response?.data ?? []).map((item: any) => normalizeNoticiaMedia(item, 600));
  } catch {
    return [];
  }
}

export async function getNoticiaBySlug(slug: string): Promise<INoticia | null> {
  try {
    const response = await strapiFetch<StrapiCollectionResponse<any>>(
      `noticias?filters[slug][$eq]=${encodeURIComponent(slug)}&populate=imagen&fields=titulo,slug,resumen,contenido,fecha`
    );
    const item = response?.data?.[0];
    return item ? normalizeNoticiaMedia(item, 1200) : null;
  } catch {
    return null;
  }
}

function normalizeProductoMedia(item: any, imageWidth?: number): IProducto {
  const raw = item?.attributes ? item.attributes : item;
  const imgRaw = raw?.imagen?.data ?? raw?.imagen;
  const img = imgRaw && (imgRaw.attributes ?? imgRaw);
  const imgUrl = img && img.url ? (normalizeMediaUrl(img.url) ?? img.url) : null;

  return {
    id: item?.id ?? raw?.id,
    documentId: raw?.documentId ?? raw?.document_id ?? '',
    nombre: raw?.nombre ?? '',
    slug: raw?.slug ?? '',
    descripcion: raw?.descripcion ?? '',
    precio: raw?.precio ?? 0,
    imagen: img && imgUrl
      ? { id: img.id, url: imageWidth ? optimizeCloudinaryImage(imgUrl, imageWidth) : imgUrl, alternativeText: img.alternativeText ?? null }
      : null,
    destacado: raw?.destacado ?? false,
    whatsappMensaje: raw?.whatsappMensaje ?? null,
    createdAt: raw?.createdAt ?? '',
    updatedAt: raw?.updatedAt ?? '',
    publishedAt: raw?.publishedAt ?? '',
  };
}

export async function getProductos(): Promise<IProducto[]> {
  try {
    const response = await strapiFetch<StrapiCollectionResponse<any>>(
      'productos?populate=imagen&fields=nombre,slug,descripcion,precio,destacado,whatsappMensaje&sort=destacado:desc,createdAt:desc'
    );
    return (response?.data ?? []).map((item: any) => normalizeProductoMedia(item, 500));
  } catch {
    return [];
  }
}

interface CreateAdoptionRequestInput {
  pet: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  neighborhood: string;
  age: number;
  convivencia: 'Solo' | 'Con otros';
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

function extractStrapiErrorMessage(error: unknown): string | null {
  try {
    if (error instanceof Error) {
      const parsed = JSON.parse(error.message);
      const strapiMsg = (parsed as any)?.error?.message;
      if (strapiMsg) return String(strapiMsg);
    }
  } catch {
    // Not JSON, ignore
  }
  return null;
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
      pet: { connect: [data.pet] },
      adopter: { connect: [adopterDocumentId] },
      convivencia: data.convivencia,
      adoptionReason: data.adoptionReason,
    });

    return {
      success: true,
      message: 'Solicitud enviada con exito. Te contactaremos en un plazo maximo de 48 horas.',
    };
  } catch (error) {
    console.error('Error creating adoption request:', error);
    const strapiMsg = extractStrapiErrorMessage(error);
    return {
      success: false,
      message: strapiMsg ?? 'No fue posible enviar la solicitud de adopcion. Intenta nuevamente.',
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
      pet: { connect: [{ documentId: data.pet }] },
      sponsor: { connect: [{ documentId: sponsorDocumentId }] },
      monthlyAmount: data.monthlyAmount,
    });

    return {
      success: true,
      message: 'Solicitud de apadrinamiento enviada con exito. Te contactaremos pronto.',
    };
  } catch (error) {
    console.error('Error creating sponsor request:', error);
    const strapiMsg = extractStrapiErrorMessage(error);
    return {
      success: false,
      message: strapiMsg ?? 'No fue posible enviar la solicitud de apadrinamiento. Intenta nuevamente.',
    };
  }
}