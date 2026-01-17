import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [viteSingleFile()],
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // rollupOptions: {
    //   output: {
    //     inlineDynamicImports: true,
    //   }
    // }
  },
  server: {
    port: 3000,
    open: true
  }
});
