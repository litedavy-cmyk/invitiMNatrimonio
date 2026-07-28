/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import os from 'os';

const BUNDLED_DIR = path.join(process.cwd(), 'server', 'data');
const TMP_DIR = path.join(os.tmpdir(), 'wedding_app_data');

// Memory store to keep state fast and consistent within serverless function lifecycles
const memoryStore = new Map<string, string>();

let isReadOnlyFs: boolean | null = null;

function checkIsReadOnly(): boolean {
  if (isReadOnlyFs !== null) return isReadOnlyFs;
  if (process.env.NETLIFY || process.env.LAMBDA_TASK_ROOT || process.env.AWS_EXECUTION_ENV) {
    isReadOnlyFs = true;
    return true;
  }
  try {
    if (!fsSync.existsSync(BUNDLED_DIR)) {
      fsSync.mkdirSync(BUNDLED_DIR, { recursive: true });
    }
    const testFile = path.join(BUNDLED_DIR, `.write_test_${Date.now()}`);
    fsSync.writeFileSync(testFile, 'test');
    fsSync.unlinkSync(testFile);
    isReadOnlyFs = false;
    return false;
  } catch {
    isReadOnlyFs = true;
    return true;
  }
}

export async function readDataFile(filename: string, defaultValue: string = ''): Promise<string> {
  // 1. Memory cache check
  if (memoryStore.has(filename)) {
    return memoryStore.get(filename)!;
  }

  const isReadOnly = checkIsReadOnly();

  // 2. Read from writable tmp dir if read-only filesystem (Netlify/Lambda)
  if (isReadOnly) {
    const tmpFilePath = path.join(TMP_DIR, filename);
    try {
      const data = await fs.readFile(tmpFilePath, 'utf-8');
      memoryStore.set(filename, data);
      return data;
    } catch {
      // Not found in tmp, fall through to bundled dir
    }
  }

  // 3. Fallback to reading bundled file from process.cwd()/server/data
  const bundledFilePath = path.join(BUNDLED_DIR, filename);
  try {
    const data = await fs.readFile(bundledFilePath, 'utf-8');
    memoryStore.set(filename, data);
    return data;
  } catch {
    return defaultValue;
  }
}

export async function writeDataFile(filename: string, content: string): Promise<void> {
  memoryStore.set(filename, content);

  const isReadOnly = checkIsReadOnly();
  const targetDir = isReadOnly ? TMP_DIR : BUNDLED_DIR;

  try {
    if (!fsSync.existsSync(targetDir)) {
      await fs.mkdir(targetDir, { recursive: true });
    }
    const targetFilePath = path.join(targetDir, filename);
    await fs.writeFile(targetFilePath, content, 'utf-8');
  } catch (err) {
    console.error(`⚠️ Could not write file ${filename} to ${targetDir}:`, err);
  }
}

export async function appendDataFile(filename: string, content: string): Promise<void> {
  const current = await readDataFile(filename, '');
  const updated = current + content;
  await writeDataFile(filename, updated);
}

export async function removeDataFile(filename: string): Promise<void> {
  memoryStore.delete(filename);
  const isReadOnly = checkIsReadOnly();
  const targetDir = isReadOnly ? TMP_DIR : BUNDLED_DIR;

  try {
    await fs.unlink(path.join(targetDir, filename));
  } catch {}

  if (isReadOnly) {
    try {
      await fs.unlink(path.join(BUNDLED_DIR, filename));
    } catch {}
  }
}
