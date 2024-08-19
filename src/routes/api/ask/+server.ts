import { json, error } from '@sveltejs/kit';
import type { RequestEvent, RequestHandler } from './$types';
import sharp from 'sharp';

const TARGET_FILE_SIZE_BYTES = 1024 * 1024; // 1MB

async function resizeImage(file: File): Promise<Buffer> {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    let quality = 90;
    let resizedImage = await sharp(buffer).jpeg({ quality }).toBuffer();
    
    while (resizedImage.length > TARGET_FILE_SIZE_BYTES && quality > 10) {
        quality -= 10;
        resizedImage = await sharp(buffer).jpeg({ quality }).toBuffer();
    }
    
    return resizedImage;
}

export const POST: RequestHandler = async ({ request, params, platform }: RequestEvent) => {
    const data = await request.formData();
    const image = data.get('image') as File;
    const question = data.get('question') as string;
    
    if (!image || !question) {
        return error(400, { message: 'Image and question are required' });
    }

    try {
        const resizedImageBuffer = await resizeImage(image);
        
        const response = await platform?.env.AI.run('@cf/llava-hf/llava-1.5-7b-hf', {
            image: [...new Uint8Array(resizedImageBuffer)],
            prompt: question,
            max_tokens: 2048
        });
        
        return json(response);
    } catch (err) {
        console.error('Error processing image:', err);
        return error(500, { message: 'Error processing image' });
    }
};