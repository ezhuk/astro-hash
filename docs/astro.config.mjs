import starlight from '@astrojs/starlight';
// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://ezhuk.github.io/astro-hash/',
  base: '/astro-hash/',
  integrations: [
    starlight({
      title: 'Astro Hash Docs',
      description:
        'Astro integration to automatically generate SRI and CSP hashes.',
      favicon: 'favicon.ico',
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/ezhuk/astro-hash',
        },
      ],
      sidebar: [
        {
          label: 'Start Here',
          items: [{ label: 'Getting Started', link: '/getting-started' }],
        },
      ],
    }),
  ],
});
