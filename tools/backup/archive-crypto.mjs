import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  scryptSync,
} from 'node:crypto';
import {
  appendFile,
  open,
  readFile,
  unlink,
  writeFile,
} from 'node:fs/promises';
import { createReadStream, createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';

const FORMAT = 'tickist-encrypted-backup';
const VERSION = 1;
const TAG_LENGTH = 16;
const MAX_HEADER_LENGTH = 4096;

function deriveKey(password, salt) {
  return scryptSync(password, salt, 32, {
    N: 32768,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  });
}

export async function encryptFile(inputPath, outputPath, password) {
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const header = Buffer.from(
    `${JSON.stringify({
      format: FORMAT,
      version: VERSION,
      cipher: 'aes-256-gcm',
      kdf: 'scrypt',
      salt: salt.toString('hex'),
      iv: iv.toString('hex'),
    })}\n`
  );
  const cipher = createCipheriv('aes-256-gcm', deriveKey(password, salt), iv);
  cipher.setAAD(header);
  await writeFile(outputPath, header, { flag: 'wx', mode: 0o600 });
  try {
    await pipeline(
      createReadStream(inputPath),
      cipher,
      createWriteStream(outputPath, { flags: 'a', mode: 0o600 })
    );
    await appendFile(outputPath, cipher.getAuthTag());
  } catch (error) {
    await unlink(outputPath).catch(() => undefined);
    throw error;
  }
}

async function readHeader(inputPath) {
  const handle = await open(inputPath, 'r');
  try {
    const buffer = Buffer.alloc(MAX_HEADER_LENGTH);
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
    const newlineIndex = buffer.subarray(0, bytesRead).indexOf(0x0a);
    if (newlineIndex < 0) {
      throw new Error('Encrypted backup header is missing.');
    }
    const header = buffer.subarray(0, newlineIndex + 1);
    const parsed = JSON.parse(header.subarray(0, -1).toString('utf8'));
    if (
      parsed.format !== FORMAT ||
      parsed.version !== VERSION ||
      parsed.cipher !== 'aes-256-gcm' ||
      parsed.kdf !== 'scrypt'
    ) {
      throw new Error('Unsupported encrypted backup format.');
    }
    if (
      !/^[a-f0-9]{32}$/.test(parsed.salt) ||
      !/^[a-f0-9]{24}$/.test(parsed.iv)
    ) {
      throw new Error('Encrypted backup header is invalid.');
    }
    return { header, parsed };
  } finally {
    await handle.close();
  }
}

export async function decryptFile(inputPath, outputPath, password) {
  const { header, parsed } = await readHeader(inputPath);
  const handle = await open(inputPath, 'r');
  let size;
  let tag;
  try {
    ({ size } = await handle.stat());
    if (size <= header.length + TAG_LENGTH) {
      throw new Error('Encrypted backup payload is empty.');
    }
    tag = Buffer.alloc(TAG_LENGTH);
    await handle.read(tag, 0, TAG_LENGTH, size - TAG_LENGTH);
  } finally {
    await handle.close();
  }
  const decipher = createDecipheriv(
    'aes-256-gcm',
    deriveKey(password, Buffer.from(parsed.salt, 'hex')),
    Buffer.from(parsed.iv, 'hex')
  );
  decipher.setAAD(header);
  decipher.setAuthTag(tag);
  try {
    await pipeline(
      createReadStream(inputPath, {
        start: header.length,
        end: size - TAG_LENGTH - 1,
      }),
      decipher,
      createWriteStream(outputPath, { flags: 'wx', mode: 0o600 })
    );
  } catch (error) {
    await unlink(outputPath).catch(() => undefined);
    throw new Error(
      `Backup decryption or authentication failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export async function sha256File(filePath) {
  const hash = createHash('sha256');
  await pipeline(createReadStream(filePath), hash);
  return hash.digest('hex');
}

export async function verifyChecksumFile(backupPath, checksumPath) {
  const expected = (await readFile(checksumPath, 'utf8'))
    .trim()
    .split(/\s+/)[0];
  if (!/^[a-f0-9]{64}$/.test(expected)) {
    throw new Error('Checksum file does not contain a valid SHA-256 hash.');
  }
  const actual = await sha256File(backupPath);
  if (actual !== expected) {
    throw new Error('Encrypted backup checksum mismatch.');
  }
  return actual;
}
