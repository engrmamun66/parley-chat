import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

// Library build: one self-contained IIFE (Vue + CSS inlined) → dist/parley-live-chat.js
export default defineConfig({
  plugins: [vue()],
  // local-dev-server loads /src/main.js from here (VITE_DEV_URL), so keep the port fixed.
  // 5199, not Vite's default 5173, so other Vite projects running on this machine don't clash.
  server: { port: 5199, strictPort: true },
  define: {
    __PARLEY_VERSION__: JSON.stringify(pkg.version),
    'process.env.NODE_ENV': JSON.stringify('production'),
    __VUE_OPTIONS_API__: 'false',
    __VUE_PROD_DEVTOOLS__: 'false',
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false'
  },
  // Escape non-ASCII (·, —, emoji) so the bundle renders right even on non-UTF-8 host pages.
  esbuild: { charset: 'ascii' },
  build: {
    lib: {
      entry: 'src/main.js',
      name: 'ParleyChat',
      formats: ['iife'],
      fileName: () => 'parley-live-chat.js'
    },
    cssCodeSplit: false,
    sourcemap: false,
    target: 'es2018',
    rollupOptions: { output: { inlineDynamicImports: true } }
  }
});
