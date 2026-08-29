// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite'
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://www.fundacionhuelladeesperanza.org/', // URL de desarrollo local
  adapter: vercel(),
  vite: {
    plugins: [tailwindcss()]
  }
});