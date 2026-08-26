import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  output: 'server',
  adapter: cloudflare(),
  integrations: [sitemap()],
  session: false,
  site: 'https://ti-automation-studio.workers.dev',
});
