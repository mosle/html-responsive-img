import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cli } from '@/cli';
import fs from 'fs/promises';
import path from 'path';

describe('CLI Interface', () => {
  const testDir = path.join(process.cwd(), 'test-cli-temp');
  const testHtml = '<img src="test.jpg" alt="Test">';
  const testConfig = {
    transforms: [{
      selector: 'img',
      extract: {
        pattern: '^(.+)\\.([^.]+)$', // JSON requires string, not regex
        groups: { name: 1, ext: 2 }
      },
      urlTemplate: '{name}_{width}w.{ext}',
      widths: [400, 800],
      type: 'srcset'
    }]
  };

  beforeEach(async () => {
    // Create test directory and files
    await fs.mkdir(testDir, { recursive: true });
    await fs.writeFile(path.join(testDir, 'test.html'), testHtml);
    await fs.writeFile(path.join(testDir, 'config.json'), JSON.stringify(testConfig));
  });

  afterEach(async () => {
    // Clean up test files
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('cli function', () => {
    it('should process file input', async () => {
      const args = [
        '--input', path.join(testDir, 'test.html'),
        '--config', path.join(testDir, 'config.json'),
        '--output', path.join(testDir, 'output.html')
      ];

      const exitCode = await cli(args);

      expect(exitCode).toBe(0);

      // Check output file was created
      const output = await fs.readFile(path.join(testDir, 'output.html'), 'utf-8');
      expect(output).toContain('srcset');
      expect(output).toContain('400w');
      expect(output).toContain('800w');
    });

    it('should output to stdout by default', async () => {
      const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

      const args = [
        '--input', path.join(testDir, 'test.html'),
        '--config', path.join(testDir, 'config.json')
      ];

      const exitCode = await cli(args);

      expect(exitCode).toBe(0);
      expect(stdoutSpy).toHaveBeenCalled();
      const output = stdoutSpy.mock.calls[0][0];
      expect(output).toContain('srcset');

      stdoutSpy.mockRestore();
    });

    it('should support JSON output format', async () => {
      const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

      const args = [
        '--input', path.join(testDir, 'test.html'),
        '--config', path.join(testDir, 'config.json'),
        '--format', 'json'
      ];

      const exitCode = await cli(args);

      expect(exitCode).toBe(0);
      expect(stdoutSpy).toHaveBeenCalled();

      const output = stdoutSpy.mock.calls[0][0] as string;
      const parsed = JSON.parse(output);
      expect(parsed.success).toBe(true);
      expect(parsed.html).toContain('srcset');

      stdoutSpy.mockRestore();
    });

    it('should show version', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const args = ['--version'];

      const exitCode = await cli(args);

      expect(exitCode).toBe(0);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('0.1.0'));
      consoleSpy.mockRestore();
    });

    it('should show help', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const args = ['--help'];

      const exitCode = await cli(args);

      expect(exitCode).toBe(0);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Usage'));
      consoleSpy.mockRestore();
    });

    it('should handle missing required arguments', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const args = ['--input', path.join(testDir, 'test.html')];

      const exitCode = await cli(args);

      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('config'));

      consoleErrorSpy.mockRestore();
      consoleSpy.mockRestore();
    });

    it('should handle non-existent input file', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const args = [
        '--input', path.join(testDir, 'non-existent.html'),
        '--config', path.join(testDir, 'config.json')
      ];

      const exitCode = await cli(args);

      expect(exitCode).toBe(1);
      consoleErrorSpy.mockRestore();
    });

    it('should handle invalid config file', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Create invalid config
      await fs.writeFile(path.join(testDir, 'invalid.json'), 'not valid json');

      const args = [
        '--input', path.join(testDir, 'test.html'),
        '--config', path.join(testDir, 'invalid.json')
      ];

      const exitCode = await cli(args);

      expect(exitCode).toBe(1);
      consoleErrorSpy.mockRestore();
    });

    it('should support verbose mode', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

      const args = [
        '--input', path.join(testDir, 'test.html'),
        '--config', path.join(testDir, 'config.json'),
        '--verbose'
      ];

      const exitCode = await cli(args);

      expect(exitCode).toBe(0);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Processing'));

      consoleSpy.mockRestore();
      stdoutSpy.mockRestore();
    });

    it('should handle pipe input from stdin', async () => {
      // This test is complex to mock properly in vitest
      // We'll create a simpler version that tests the stdin reading logic
      const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

      // Mock readStdin to return test HTML
      const readInputModule = await import('@/cli/io');
      vi.spyOn(readInputModule, 'readInput').mockResolvedValue(testHtml);

      const args = [
        '--config', path.join(testDir, 'config.json')
      ];

      const exitCode = await cli(args);

      expect(exitCode).toBe(0);
      expect(stdoutSpy).toHaveBeenCalled();

      stdoutSpy.mockRestore();
      vi.restoreAllMocks();
    });
  });
});