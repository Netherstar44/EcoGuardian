import { v2 as cloudinary } from 'cloudinary';

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  throw new Error('Cloudinary credentials not set');
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadToCloudinary(base64Data: string, resourceType: 'image' | 'video' = 'image'): Promise<string> {
  const result = await cloudinary.uploader.upload(`data:${resourceType === 'video' ? 'video' : 'image'}/jpeg;base64,${base64Data}`, {
    folder: 'ecoguardian',
    resource_type: resourceType,
  });
  return result.secure_url;
}

export default cloudinary;