import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig(() => {
  const useSingleFile = process.env.VITE_SINGLEFILE === 'true';

  return {
    plugins: useSingleFile ? [viteSingleFile()] : [],
    base: './',
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      cssCodeSplit: false,
      rollupOptions: {
        output: {
          inlineDynamicImports: true,
        }
      }
    },
    server: {
      port: 3000,
      open: true
    }
  };
});

