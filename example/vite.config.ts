import react from '@vitejs/plugin-react';
import { resolve as resolvePath } from 'path';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'react-use-await': resolvePath(__dirname, '../src/useAwait'),
    },
  },
});
