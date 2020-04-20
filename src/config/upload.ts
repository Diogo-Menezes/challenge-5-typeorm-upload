import multer from 'multer';
import path from 'path';

const tmpFolderPath = path.resolve(__dirname, '..', '..', 'tmp');
export default {
  tmpDir: tmpFolderPath,

  storage: multer.diskStorage({
    destination: tmpFolderPath,
    filename(request, file, callback) {
      const filename = `${Date.now()}-${file.originalname}`;
      return callback(null, filename);
    },
  }),
};
