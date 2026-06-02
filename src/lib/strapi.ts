import type { StrapiSingleResponse, StrapiCollectionResponse } from '../types/strapi';

const STRAPI_URL = import.meta.env.PUBLIC_STRAPI_URL;
const STRAPI_TOKEN = import.meta.env.STRAPI_API_TOKEN;

if (!STRAPI_URL || !STRAPI_TOKEN) {
  console.warn('⚠️ Advertencia: PUBLIC_STRAPI_URL o STRAPI_API_TOKEN no están definidos en el archivo .env');
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