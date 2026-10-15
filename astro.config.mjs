// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  site: 'https://hugo-rybinski.github.io',
  base: '/odysseyra-blog',
  integrations: [mdx()],
});
