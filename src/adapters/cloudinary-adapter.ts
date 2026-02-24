import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const cloudinaryAdapters = {
  async uploadFile(
    filePath: string,
    folder: string = "mint-chat",
  ): Promise<{ url: string; fileType: string; fileName: string }> {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: "auto",
    });
    return {
      url: result.secure_url,
      fileType: result.resource_type,
      fileName: result.original_filename,
    };
  },
  async deleteFile(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
  },
};
