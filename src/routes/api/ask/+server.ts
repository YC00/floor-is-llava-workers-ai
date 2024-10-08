import { json, error } from '@sveltejs/kit';

// You should not import the general types from `@sveltejs/kit`.
import type { RequestEvent, RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, params, platform }: RequestEvent) => {
	const data = await request.formData();
	const image = data.get('image') as File;
	// const question = data.get('question') as string;
	const question = 'Extract all the texts found in the image, don\'t add any description';
	if (!image || !question) {
		return error(400, { message: 'Image and question are required' });
	}

	// Check if the image file size exceeds 10MB
	const maxFileSize = 10 * 1024 * 1024; // 10MB in bytes
	if (image.size > maxFileSize) {
		return error(413, { message: 'File size exceeds 10MB limit' });
	}

    const blob = await image.arrayBuffer();
	const response = await platform?.env.AI.run('@cf/llava-hf/llava-1.5-7b-hf', {
        image: [...new Uint8Array(blob)],
        prompt: question,
        max_tokens: 2048
    });
	return json(response);
};
