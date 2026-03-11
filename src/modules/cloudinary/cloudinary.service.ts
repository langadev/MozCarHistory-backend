import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import streamifier from 'streamifier';

@Injectable()
export class CloudinaryService {
  async uploadFile(file: Express.Multer.File): Promise<UploadApiResponse | UploadApiErrorResponse> {
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream((error, result) => {
        if (error || !result) return reject(error || new Error('Upload failed'));
        resolve(result);
      });

      streamifier.createReadStream(file.buffer).pipe(upload);
    });
  }

  async uploadMultiple(files: Express.Multer.File[]): Promise<(UploadApiResponse | UploadApiErrorResponse)[]> {
    const uploadPromises = files.map((file) => this.uploadFile(file));
    return Promise.all(uploadPromises);
  }
}
