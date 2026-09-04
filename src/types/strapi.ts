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
 * Renderiza contenido HTML producido por CKEditor5 (plugin: ckeditor5)
 */
export interface INoticia {
  id: number;
  documentId: string;
  titulo: string;
  slug: string;
  resumen: string;
  contenido: string; // HTML plano producido por CKEditor5
  fecha: string;
  imagen?: {
    id: number;
    url: string;
    alternativeText?: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

export interface IPet {
  id: number;
  documentId: string;
  name: string;
  description: string;
  species: 'Perro' | 'Gato';
  ageGroup: string;
  gender: 'Macho' | 'Hembra';
  size: 'Pequeño' | 'Mediano' | 'Grande';
  convivencia: 'Solo' | 'Con otros';
  isAdopted: boolean;
  adoptedDated?: string | null;
  estadoInventario?: 'En adopción' | 'Reservado' | 'Adoptado' | 'Retirado';
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

/**
 * Estructura de datos para los productos del Catalogo Solidario
 * Cada producto se comunica con el cliente via WhatsApp (sin pasarela de pago)
 */
export interface IProducto {
  id: number;
  documentId: string;
  nombre: string;
  slug: string;
  descripcion: string;
  precio: number; // Precio en pesos colombianos (COP)
  imagen?: {
    id: number;
    url: string;
    alternativeText?: string | null;
  } | null;
  destacado: boolean;
  whatsappMensaje?: string | null;
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