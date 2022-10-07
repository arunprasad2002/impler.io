import { Readable } from 'stream';
import {
  S3Client,
  PutObjectCommand,
  PutObjectCommandOutput,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { FileNotExistError } from '../errors/file-not-exist.error';

export interface IFilePath {
  path: string;
  name: string;
}

export abstract class StorageService {
  abstract uploadFile(
    key: string,
    file: Buffer,
    contentType: string,
    isPublic?: boolean
  ): Promise<PutObjectCommandOutput>;
  abstract getFile(key: string): Promise<Buffer>;
  abstract deleteFile(key: string): Promise<void>;
}

async function streamToString(stream: Readable): Promise<string> {
  return await new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('base64')));
  });
}

export class S3StorageService implements StorageService {
  private s3 = new S3Client({
    region: process.env.S3_REGION,
    endpoint: process.env.S3_LOCAL_STACK || undefined,
    forcePathStyle: true,
  });

  async uploadFile(key: string, file: Buffer, contentType: string, isPublic = false): Promise<PutObjectCommandOutput> {
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      Body: file,
      ACL: isPublic ? 'public-read' : 'private',
      ContentType: contentType,
    });

    return await this.s3.send(command);
  }

  async getFile(key: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
      });
      const data = await this.s3.send(command);
      const bodyContents = await streamToString(data.Body as Readable);

      return bodyContents as unknown as Buffer;
    } catch (error) {
      if (error.code === 404 || error.message === 'The specified key does not exist.') {
        throw new FileNotExistError();
      }
      throw error;
    }
  }

  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
    });
    await this.s3.send(command);
  }
}