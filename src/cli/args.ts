import type { CliOptions } from '../types';

/**
 * Parse command line arguments
 */
export function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    config: ''
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case '--input':
      case '-i':
        if (nextArg && !nextArg.startsWith('-')) {
          options.input = nextArg;
          i++;
        }
        break;

      case '--output':
      case '-o':
        if (nextArg && !nextArg.startsWith('-')) {
          options.output = nextArg;
          i++;
        }
        break;

      case '--config':
      case '-c':
        if (nextArg && !nextArg.startsWith('-')) {
          options.config = nextArg;
          i++;
        }
        break;

      case '--format':
      case '-f':
        if (nextArg && (nextArg === 'html' || nextArg === 'json')) {
          options.format = nextArg as 'html' | 'json';
          i++;
        }
        break;

      case '--verbose':
      case '-v':
        options.verbose = true;
        break;

      case '--version':
        options.version = true;
        break;

      case '--help':
      case '-h':
        options.help = true;
        break;

      default:
        // Ignore unknown arguments
        break;
    }
  }

  return options;
}