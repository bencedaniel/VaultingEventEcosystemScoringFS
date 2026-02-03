import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { logger } from '../logger.js';
import { FILE_UPLOAD } from '../config/index.js';

const uploadDir = path.join(process.cwd(), 'static', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, '_');
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const generated = `${base}-${unique}${ext}`;
    cb(null, generated);
    try { logger?.db?.(`Upload: ${file.originalname} -> ${generated}`); } catch {}
  }
});

function fileFilter(_req, file, cb) {
  const ok = FILE_UPLOAD.ALLOWED_IMAGE_TYPES.includes(file.mimetype);
  cb(ok ? null : new Error('Only image files allowed'), ok);
}

export const uploadImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: FILE_UPLOAD.MAX_FILE_SIZE }
});