import fs from 'fs';
import path from 'path';
import {v4 as uuidv4} from 'uuid';

const storageDir = path.join(__dirname, '../../data/uploads');

if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, {recursive: true});
}

export async function uploadFile(
  fileBuffer: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  const fileId = uuidv4();
  const extension = path.extname(fileName);
  const savedFileName = `${fileId}${extension}`;
  const filePath = path.join(storageDir, savedFileName);

  fs.writeFileSync(filePath, fileBuffer);

  return `/uploads/${savedFileName}`;
}

export function getFileUrl(fileName: string): string {
  return `/uploads/${fileName}`;
}

export function getFilePath(fileName: string): string {
  return path.join(storageDir, fileName);
}

