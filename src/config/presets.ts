import type { Config, TransformConfig } from '../types';
import type { PresetConfig, PresetName } from '../types/presets';
import { presetsData } from './presets-data';

/**
 * Load a preset configuration
 */
export function loadPreset(presetName: string, options?: Partial<Config>): Config {
  const preset = presetsData[presetName as PresetName];

  if (!preset) {
    throw new Error(`Unknown preset: ${presetName}`);
  }

  // Merge preset with options
  const config: Config = {
    preset: presetName,
    ...options,
    transforms: mergeTransforms(preset.transforms, options?.transforms)
  };

  return config;
}

/**
 * Merge preset transforms with custom transforms
 */
function mergeTransforms(
  presetTransforms: TransformConfig[],
  customTransforms?: TransformConfig[]
): TransformConfig[] {
  if (!customTransforms || customTransforms.length === 0) {
    return [...presetTransforms];
  }

  // If custom transforms are provided, they override preset transforms
  return [...customTransforms];
}

/**
 * Get all available preset names
 */
export function getAvailablePresets(): string[] {
  return Object.keys(presetsData);
}

/**
 * Get preset information
 */
export function getPresetInfo(presetName: string): PresetConfig | undefined {
  return presetsData[presetName as PresetName];
}