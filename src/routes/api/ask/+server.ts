import { json, error } from '@sveltejs/kit';
import { resize } from '@cf-wasm/photon';  // Import the resize function

// You should not import the general types from `@sveltejs/kit`.
import type { RequestEvent, RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, params, platform }: RequestEvent) => {
	const data = await request.formData();
	const image = data.get('image') as File;
	const question = data.get('question') as string;

	if (!image || !question) {
		return error(400, { message: 'Image and question are required' });
	}

    // Convert the image to an ArrayBuffer
	const blob = await image.arrayBuffer();

    // Resize the image using photon to reduce its size to 1MB
	let resizedImage = await resize(new Uint8Array(blob), {
		max_size: 1048576, // 1MB in bytes
		format: image.type.split('/')[1], // Extract the format (e.g., 'jpeg', 'png')
	});

	// Run the AI model with the resized image
	const response = await platform?.env.AI.run('@cf/llava-hf/llava-1.5-7b-hf', {
        image: [...new Uint8Array(resizedImage)],
        prompt: question,
        max_tokens: 2048
    });

	return json(response);
};