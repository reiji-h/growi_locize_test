import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    dts({ outputDir: 'types' }),
  ],
  build: {
    outDir: 'dist/libs',
    copyPublicDir: false,
    lib: {
      entry: 'src/index.ts',
      name: 'preset-themes-libs',
      formats: ['es', 'umd'],
    },
    rollupOptions: {
      external: [
      ],
    },
  },
});
