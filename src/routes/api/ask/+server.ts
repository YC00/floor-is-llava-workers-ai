import { json, error } from '@sveltejs/kit';
import type { RequestEvent, RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, params, platform }: RequestEvent) => {
  const data = await request.formData();
  const image = data.get('image') as File;
  const question = data.get('question') as string;

  if (!image || !question) {
    return error(400, { message: 'Image and question are required' });
  }

  // Resize image to approximately 1MB
  const resizedImageBuffer = await resizeImage(image);

  const response = await platform?.env.AI.run('@cf/llava-hf/llava-1.5-7b-hf', {
    image: [...new Uint8Array(resizedImageBuffer)],
    prompt: question,
    max_tokens: 2048
  });

  return json(response);
};

async function resizeImage(file: File): Promise<ArrayBuffer> {
  const MAX_SIZE = 1024 * 1024; // 1MB
  const img = await createImageBitmap(file);
  
  let width = img.width;
  let height = img.height;
  let quality = 0.8;

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get 2D context');

  // Initial draw
  ctx.drawImage(img, 0, 0, width, height);

  // Resize and reduce quality until the image is under 1MB
  while (true) {
    const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality });
    if (blob.size <= MAX_SIZE) {
      return await blob.arrayBuffer();
    }

    // Reduce dimensions
    width *= 0.9;
    height *= 0.9;

    // Redraw at new size
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, 0, 0, width, height);

    // If dimensions are very small, start reducing quality instead
    if (width < 100 || height < 100) {
      quality *= 0.9;
      if (quality < 0.1) {
        throw new Error('Unable to resize image to under 1MB');
      }
    }
  }
}