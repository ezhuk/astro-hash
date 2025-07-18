## Astro Hash 🚀 #️⃣

[![test](https://github.com/ezhuk/astro-hash/actions/workflows/test.yml/badge.svg)](https://github.com/ezhuk/astro-hash/actions/workflows/test.yml)
[![codecov](https://codecov.io/github/ezhuk/astro-hash/graph/badge.svg?token=IOWJ17XM82)](https://codecov.io/github/ezhuk/astro-hash)
[![prod](https://github.com/ezhuk/astro-hash/actions/workflows/prod.yml/badge.svg)](https://github.com/ezhuk/astro-hash/actions/workflows/prod.yml)

An [Astro Integration](https://docs.astro.build/en/guides/integrations-guide/) that automatically generates and injects [Subresource Integrity (SRI)](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity) and [Content Security Policy (CSP)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP) hashes for CSS and JavaScript assets at build time, helping mitigate supply-chain and cross-site scripting risks.

##  Getting Started

Make sure to configure your `.npmrc` to enable installing scoped packages. See [Installing a package from GitHub Packages](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry#installing-a-package) for instructions and more details.

```bash
npm install --save-dev @ezhuk/astro-hash
```

In your `astro.config.*` file, import and register the integration:

```javascript
import { defineConfig } from 'astro/config';
import { security } from '@ezhuk/astro-hash';

export default defineConfig({
  // ...
  integrations: [
    security()
  ]
});
```

Build your site, and Astro Hash will automatically annotate `<link>`, `<style>`, and `<script>` tags in the generated HTML files in the output directory with `SRI` and `CSP` hashes.

```bash
npm run build
```

When the build finishes, take note of the injected attributes and add the generated hashes to your `Content-Security-Policy` HTTP headers so browsers can enforce them.

## Documentation

See the [full documentation](https://docs.ezhuk.dev/astro-hash) for more details.

## License

The integration is licensed under the [MIT License](https://github.com/ezhuk/astro-hash?tab=MIT-1-ov-file).

