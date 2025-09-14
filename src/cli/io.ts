import { promises as fs } from 'fs';
import { resolve } from 'path';
import type { Config } from '../types';

/**
 * Read input from file or stdin
 */
export async function readInput(inputPath?: string): Promise<string | null> {
  try {
    if (inputPath) {
      // Read from file
      const absolutePath = resolve(inputPath);
      return await fs.readFile(absolutePath, 'utf-8');
    } else {
      // Read from stdin
      return await readStdin();
    }
  } catch {
    return null;
  }
}

/**
 * Write output to file or stdout
 */
export async function writeOutput(content: string, outputPath?: string): Promise<void> {
  if (outputPath) {
    // Write to file
    const absolutePath = resolve(outputPath);
    await fs.writeFile(absolutePath, content, 'utf-8');
  } else {
    // Write to stdout
    process.stdout.write(content);
  }
}

/**
 * Read configuration file
 */
export async function readConfig(configPath: string): Promise<Config | null> {
  try {
    const absolutePath = resolve(configPath);
    const content = await fs.readFile(absolutePath, 'utf-8');
    return JSON.parse(content) as Config;
  } catch {
    return null;
  }
}

/**
 * Read from stdin
 */
function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';

    process.stdin.setEncoding('utf-8');

    process.stdin.on('data', chunk => {
      data += chunk;
    });

    process.stdin.on('end', () => {
      resolve(data);
    });

    process.stdin.on('error', error => {
      reject(error);
    });

    // Start reading
    process.stdin.resume();
  });
}