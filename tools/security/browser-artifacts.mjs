import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

export async function scanBrowserArtifacts(directory, forbiddenValues) {
  const findings = [];
  let filesScanned = 0;

  const signatures = Object.entries(forbiddenValues).flatMap(
    ([name, value]) => {
      if (!value) return [];

      const bytes = Buffer.from(value);

      const variants = [
        [name, value],
        [`${name}_URL_ENCODED`, encodeURIComponent(value)],
        [`${name}_BASE64`, bytes.toString('base64')],
        [`${name}_BASE64URL`, bytes.toString('base64url')],
        [`${name}_JSON_ESCAPED`, JSON.stringify(value).slice(1, -1)],
      ];

      const seen = new Set();

      return variants.flatMap(([variantName, variantValue]) => {
        if (seen.has(variantValue)) return [];

        seen.add(variantValue);

        return [{ name: variantName, bytes: Buffer.from(variantValue) }];
      });
    }
  );

  async function visit(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const path = join(current, entry.name);

      if (entry.isDirectory()) {
        await visit(path);
      } else if (entry.isFile()) {
        filesScanned += 1;
        const content = await readFile(path);

        for (const { name, bytes } of signatures) {
          if (content.includes(bytes)) {
            findings.push({ name, file: relative(directory, path) });
          }
        }
      } else {
        throw new Error(
          `Unexpected artifact type: ${relative(directory, path)}`
        );
      }
    }
  }

  await visit(directory);

  if (!filesScanned) {
    throw new Error('No browser artifacts were produced.');
  }

  return { filesScanned, findings };
}
