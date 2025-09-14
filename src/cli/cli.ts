// CliOptions type removed - not used
import { responsify } from '../index';
import { validateConfig } from '../config/validator';
import { parseArgs } from './args';
import { readInput, writeOutput, readConfig } from './io';
import { formatOutput } from './format';

/**
 * Main CLI function
 */
export async function cli(args: string[]): Promise<number> {
  try {
    // Parse command line arguments
    const options = parseArgs(args);

    // Handle version flag
    if (options.version) {
      const pkg = require('../../package.json');
      console.log(pkg.version);
      return 0;
    }

    // Handle help flag
    if (options.help) {
      showHelp();
      return 0;
    }

    // Validate required arguments
    if (!options.config) {
      console.error('Error: --config is required');
      showHelp();
      return 1;
    }

    // Read configuration
    const config = await readConfig(options.config);
    if (!config) {
      console.error(`Error: Could not read config file: ${options.config}`);
      return 1;
    }

    // Validate configuration
    const validation = validateConfig(config);
    if (!validation.valid) {
      console.error('Error: Invalid configuration');
      validation.errors?.forEach(error => {
        console.error(`  - ${error}`);
      });
      return 1;
    }

    // Read input HTML
    const html = await readInput(options.input);
    if (!html) {
      console.error('Error: Could not read input');
      return 1;
    }

    if (options.verbose) {
      console.log('Processing HTML...');
      console.log(`Images to process: ${(html.match(/<img/g) || []).length}`);
    }

    // Transform HTML
    const result = responsify(html, config);

    if (!result.success) {
      console.error(`Error: Transformation failed - ${result.error}`);
      return 1;
    }

    if (options.verbose && result.stats) {
      console.log(`Images found: ${result.stats.imagesFound}`);
      console.log(`Images transformed: ${result.stats.imagesTransformed}`);
      console.log(`Rules applied: ${result.stats.rulesApplied}`);
      console.log(`Processing time: ${result.stats.processingTime}ms`);
    }

    // Format output
    const output = formatOutput(result, options.format || 'html');

    // Write output
    await writeOutput(output, options.output);

    return 0;
  } catch (err) {
    console.error('Error:', err instanceof Error ? err.message : 'Unknown error');
    return 1;
  }
}

/**
 * Show help message
 */
function showHelp(): void {
  console.log(`
Usage: responsify [options]

Transform HTML img tags to responsive picture elements or srcset attributes.

Options:
  --input <file>     Input HTML file (optional, uses stdin if not provided)
  --output <file>    Output file (optional, uses stdout if not provided)
  --config <file>    Configuration file (required)
  --format <type>    Output format: html or json (default: html)
  --verbose          Enable verbose output
  --version          Show version number
  --help             Show this help message

Examples:
  responsify --input index.html --config config.json --output result.html
  responsify --config config.json < input.html > output.html
  cat page.html | responsify --config config.json --format json

Configuration file should be a JSON file with transformation rules.
See documentation for configuration format details.
  `);
}