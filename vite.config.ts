import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		proxy: {
			'/': {
				target: 'https://ai-handwriting-ocr.p.rapidapi.com',
				changeOrigin: true
			},
		},
	}
});
