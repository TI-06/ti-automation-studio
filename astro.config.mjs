import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  output: 'server',
  adapter: cloudflare({ session: false }),
  integrations: [sitemap()],
  site: 'https://ti-automation-studio.workers.dev',
});
