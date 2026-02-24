import { Router, Request, Response } from "express";
import multer from "multer";
import { cloudinaryAdapters } from "../adapters/cloudinary-adapter";
import fs from "fs";

const upload = multer({ dest: "uploads/" });

export const uploadRouter = Router();

uploadRouter.post(
  "/file",
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "Файл не найден" });
        return;
      }
      const result = await cloudinaryAdapters.uploadFile(req.file.path);

      fs.unlinkSync(req.file.path);
      res.status(200).json({
        url: result.url,
        fileType: result.fileType,
        fileName: req.file!.originalname,
      });
    } catch (error) {
      console.error("Ошибка загрузки файла:", error);
      res.status(500).json({ error: "Ошибка загрузки файла" });
    }
  },
);
