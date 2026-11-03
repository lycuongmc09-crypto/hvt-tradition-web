import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // để bản build tĩnh mở được ở bất kỳ thư mục/nhost nào
});
