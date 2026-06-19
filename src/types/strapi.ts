/**
 * Estructura de datos para la Página de Inicio (Single Type)
 * Mapea directamente con la respuesta REST de Strapi 5
 */
export interface IHomepage {
  id: number;
  documentId: string; // Identificador único de Strapi 5 para consultas públicas
  heroTitle: string;
  heroSubtitle: string;
  misionTitle: string;
  misionContent: string;
  visionTitle: string;
  visionContent: string;
  historiaTitle: string;
  historiaContent: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

/**
 * Estructura de datos para los artículos de Noticias (Collection Type)
 */
export interface INoticia {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  description: string;
  content: any[]; // Formato 'blocks' nativo de Strapi 5 para texto enriquecido
  publishedAtDate: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

export interface IPet {
  id: number;
  documentId: string;
  name: string;
  description: string;
  species: 'perro' | 'gato';
  ageGroup: 'cachorro' | 'joven' | 'adulto' | 'senior';
  gender: 'macho' | 'hembra';
  size: 'pequeño' | 'mediano' | 'grande';
  isAdopted: boolean;
  adoptedDated?: string | null;
  estadoInventario?: 'disponible' | 'reservado' | 'adoptado' | 'retirado';
  validadoInventario?: boolean;
  notasInventario?: string | null;
  photos?: Array<{
    id: number;
    url: string;
    alternativeText?: string | null;
  }>;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

// Interfaces genéricas para envolver las respuestas HTTP de la API de Strapi 5
export interface StrapiSingleResponse<T> {
  data: T;
  meta: Record<string, unknown>;
}

export interface StrapiCollectionResponse<T> {
  data: T[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}