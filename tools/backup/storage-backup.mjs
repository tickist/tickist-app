import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const PAGE_SIZE = 1000;
const MAX_PREFIXES_PER_BUCKET = 100_000;
const DOWNLOAD_ATTEMPTS = 3;

function failOnError(error, context) {
  if (error) throw new Error(`${context}: ${error.message}`);
}

async function withRetry(operation, context) {
  let lastError;
  for (let attempt = 1; attempt <= DOWNLOAD_ATTEMPTS; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt < DOWNLOAD_ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, 250 * attempt));
      }
    }
  }
  throw new Error(
    `${context}: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`
  );
}

async function listBucketObjects(client, bucketId) {
  const objects = [];
  const prefixes = [''];
  const visited = new Set();
  while (prefixes.length) {
    if (visited.size >= MAX_PREFIXES_PER_BUCKET) {
      throw new Error(`Storage prefix safety limit exceeded for ${bucketId}.`);
    }
    const prefix = prefixes.shift();
    if (visited.has(prefix)) continue;
    visited.add(prefix);
    for (let offset = 0; ; offset += PAGE_SIZE) {
      const { data, error } = await client.storage.from(bucketId).list(prefix, {
        limit: PAGE_SIZE,
        offset,
        sortBy: { column: 'name', order: 'asc' },
      });
      failOnError(error, `Could not list storage bucket ${bucketId}`);
      for (const item of data ?? []) {
        const objectName = prefix ? `${prefix}/${item.name}` : item.name;
        if (item.id) objects.push({ ...item, name: objectName });
        else prefixes.push(objectName);
      }
      if ((data ?? []).length < PAGE_SIZE) break;
    }
  }
  return objects;
}

export async function backupStorageObjects({
  supabaseUrl,
  serviceRoleKey,
  outputRoot,
  client: providedClient,
  log = console.log,
}) {
  const client =
    providedClient ??
    createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
  const { data: buckets, error: bucketError } =
    await client.storage.listBuckets();
  failOnError(bucketError, 'Could not list storage buckets');
  const objectsRoot = path.join(outputRoot, 'objects');
  await mkdir(objectsRoot, { recursive: true, mode: 0o700 });
  const manifest = {
    version: 1,
    buckets: [],
    objects: [],
    totalBytes: 0,
  };
  for (const bucket of buckets ?? []) {
    manifest.buckets.push({
      id: bucket.id,
      name: bucket.name,
      public: bucket.public,
      fileSizeLimit: bucket.file_size_limit ?? null,
      allowedMimeTypes: bucket.allowed_mime_types ?? null,
      createdAt: bucket.created_at ?? null,
      updatedAt: bucket.updated_at ?? null,
    });
    const objects = await listBucketObjects(client, bucket.id);
    for (const object of objects) {
      const archiveId = createHash('sha256')
        .update(`${bucket.id}\0${object.name}`)
        .digest('hex');
      const archivePath = `objects/${archiveId}.bin`;
      const targetPath = path.join(outputRoot, archivePath);
      const blob = await withRetry(async () => {
        const { data, error } = await client.storage
          .from(bucket.id)
          .download(object.name);
        failOnError(error, `Could not download ${bucket.id}/${object.name}`);
        if (!data) throw new Error('Storage download returned no data.');
        return data;
      }, `Could not download ${bucket.id}/${object.name}`);
      const content = Buffer.from(await blob.arrayBuffer());
      await writeFile(targetPath, content, { flag: 'wx', mode: 0o600 });
      const sha256 = createHash('sha256').update(content).digest('hex');
      manifest.totalBytes += content.length;
      manifest.objects.push({
        bucketId: bucket.id,
        name: object.name,
        archivePath,
        size: content.length,
        sha256,
        contentType:
          object.metadata?.mimetype ?? object.metadata?.contentType ?? null,
        cacheControl:
          object.metadata?.cacheControl ??
          object.metadata?.cache_control ??
          null,
        createdAt: object.created_at ?? null,
        updatedAt: object.updated_at ?? null,
        lastAccessedAt: object.last_accessed_at ?? null,
      });
    }
    log(`Storage ${bucket.id}: ${objects.length} object(s).`);
  }
  await writeFile(
    path.join(outputRoot, 'manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
    { flag: 'wx', mode: 0o600 }
  );
  return manifest;
}
