/**
 * Optimiza URLs de Cloudinary insertando transformaciones de formato, calidad y ancho.
 *
 * Patron de uso: se aplica en el frontend sobre URLs absolutas que llegan de Strapi.
 * Strapi guarda la URL original de Cloudinary y esta funcion la transforma para:
 *   - Servir WebP/AVIF automaticamente al navegador (f_auto)
 *   - Optimizar la calidad segun el contenido (q_auto)
 *   - Limitar el ancho para no servir imagenes mas grandes de lo necesario (w_<width>, c_limit)
 *
 * Cloudinary cobra por transformaciones y bandwidth. Limitar el ancho es la mejor
 * forma de cuidar la cuota sin sacrificar calidad visual.
 *
 * @param url   - URL absoluta de la imagen (de Strapi o Cloudinary)
 * @param width - Ancho objetivo en pixeles (ej: 500 para cards, 1200 para detalle)
 * @returns     - URL optimizada, o la original si no es de Cloudinary
 */
export const optimizeCloudinaryImage = (url: string | undefined | null, width?: number): string => {
  if (!url) return '';
  if (!url.includes('cloudinary.com')) return url;

  const parts = url.split('/upload/');
  if (parts.length !== 2) return url;

  const transformations = ['f_auto', 'q_auto'];
  if (width) {
    transformations.push(`w_${width}`);
    transformations.push('c_limit');
  }

  return `${parts[0]}/upload/${transformations.join(',')}/${parts[1]}`;
};
