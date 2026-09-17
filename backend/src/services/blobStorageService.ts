import {
  BlobServiceClient,
  ContainerClient,
} from '@azure/storage-blob';
import { env } from '../config/env';

// Replaces the legacy Microsoft.WindowsAzure.Storage blob helpers used by
// MigrationRepository for uploading/serving comic + purchase-item photos.
class BlobStorageService {
  private containerClient: ContainerClient;

  constructor() {
    const blobServiceClient = BlobServiceClient.fromConnectionString(
      env.azure.storageConnectionString
    );
    this.containerClient = blobServiceClient.getContainerClient(env.azure.storageContainer);
  }

  async ensureContainer(): Promise<void> {
    await this.containerClient.createIfNotExists({ access: 'blob' });
  }

  async uploadImage(blobName: string, buffer: Buffer, contentType: string): Promise<string> {
    await this.ensureContainer();
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.uploadData(buffer, {
      blobHTTPHeaders: { blobContentType: contentType },
    });
    return blockBlobClient.url;
  }

  async deleteImage(blobName: string): Promise<void> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.deleteIfExists();
  }

  getImageUrl(blobName: string): string {
    return this.containerClient.getBlockBlobClient(blobName).url;
  }
}

export const blobStorageService = new BlobStorageService();
