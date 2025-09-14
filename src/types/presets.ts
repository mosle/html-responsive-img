import type { TransformConfig } from './index';

/**
 * Preset configuration structure
 */
export interface PresetConfig {
  /** Name of the preset */
  name: string;
  /** Description of the preset */
  description: string;
  /** Transform configurations for this preset */
  transforms: TransformConfig[];
}

/**
 * Available built-in presets
 */
export type PresetName = 'cloudinary' | 'standard';

/**
 * Registry of all available presets
 */
export type PresetRegistry = Record<PresetName, PresetConfig>;