#!/usr/bin/env node

/**
 * CLI entry point for responsify command
 */

import { cli } from './cli';

// Only run CLI if this is the main module (not imported for testing)
if (require.main === module) {
  // Run CLI with process arguments
  cli(process.argv.slice(2))
    .then(exitCode => {
      process.exit(exitCode);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

// Export for testing
export { cli } from './cli';
export { parseArgs } from './args';
export { readInput, writeOutput } from './io';
export { formatOutput } from './format';