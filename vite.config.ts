import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		origin: 'https://ai-handwriting-ocr.p.rapidapi.com',
		host: 'rapidapi.com',
		port: 80
	}
});
