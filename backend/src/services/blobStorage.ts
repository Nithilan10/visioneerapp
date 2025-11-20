import {BlobServiceClient, StorageSharedKeyCredential} from '@azure/storage-blob';

let blobServiceClient: BlobServiceClient | null = null;

function getBlobServiceClient(): BlobServiceClient {
  if (blobServiceClient) {
    return blobServiceClient;
  }

  const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
  const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

  if (connectionString) {
    blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  } else if (accountName && accountKey) {
    const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
    const blobServiceUrl = `https://${accountName}.blob.core.windows.net`;
    blobServiceClient = new BlobServiceClient(blobServiceUrl, sharedKeyCredential);
  } else {
    throw new Error(
      'Azure Storage credentials not configured. Please set AZURE_STORAGE_ACCOUNT_NAME and AZURE_STORAGE_ACCOUNT_KEY (or AZURE_STORAGE_CONNECTION_STRING) in .env'
    );
  }

  return blobServiceClient;
}

export async function getGLBFile(containerName: string, blobName: string): Promise<Buffer> {
  try {
    const client = getBlobServiceClient();
    const containerClient = client.getContainerClient(containerName);
    const blobClient = containerClient.getBlobClient(blobName);

    const downloadResponse = await blobClient.download();
    
    if (!downloadResponse.readableStreamBody) {
      throw new Error(`Blob ${blobName} not found in container ${containerName}`);
    }

    const chunks: Uint8Array[] = [];
    for await (const chunk of downloadResponse.readableStreamBody) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  } catch (error: any) {
    if (error.statusCode === 404) {
      throw new Error(`GLB file ${blobName} not found in container ${containerName}`);
    }
    throw new Error(`Failed to retrieve GLB file: ${error.message}`);
  }
}

export async function getGLBFileUrl(containerName: string, blobName: string): Promise<string> {
  try {
    const client = getBlobServiceClient();
    const containerClient = client.getContainerClient(containerName);
    const blobClient = containerClient.getBlobClient(blobName);

    const exists = await blobClient.exists();
    if (!exists) {
      throw new Error(`GLB file ${blobName} not found in container ${containerName}`);
    }

    return blobClient.url;
  } catch (error: any) {
    if (error.statusCode === 404 || error.message.includes('not found')) {
      throw new Error(`GLB file ${blobName} not found in container ${containerName}`);
    }
    throw new Error(`Failed to get GLB file URL: ${error.message}`);
  }
}

export async function listGLBFiles(containerName: string, prefix?: string): Promise<string[]> {
  try {
    const client = getBlobServiceClient();
    const containerClient = client.getContainerClient(containerName);
    
    const blobNames: string[] = [];
    const options = prefix ? {prefix} : {};
    
    for await (const blob of containerClient.listBlobsFlat(options)) {
      if (blob.name.endsWith('.glb')) {
        blobNames.push(blob.name);
      }
    }

    return blobNames;
  } catch (error: any) {
    throw new Error(`Failed to list GLB files: ${error.message}`);
  }
}

