import { readFile } from 'node:fs/promises';
import { describe, expect, test } from 'vitest';

import { clientNames } from '../dist/clients.js';
import { getFeatures, rawData } from '../dist/features.js';

const getDataClients = () =>
  [
    ...new Set(
      rawData.data.flatMap((feature) =>
        Object.entries(feature.stats).flatMap(([provider, platforms]) =>
          Object.keys(platforms).map((platform) => `${provider}.${platform}`)
        )
      )
    )
  ].sort();

describe('data drift', () => {
  test('clientNames matches data stats clients', () => {
    expect([...clientNames].sort()).toEqual(getDataClients());
  });

  test('RawFeatureStats handwritten keys match data stats clients', async () => {
    const source = await readFile('src/json.ts', 'utf8');
    const typedClients: string[] = [];
    let provider: string | undefined;

    for (const line of source.split('\n')) {
      const singleLineProviderMatch = line.match(
        /^  '?([a-z0-9-]+)'?\?: \{ '?([a-z0-9-]+)'?\?: Record/
      );
      if (singleLineProviderMatch) {
        typedClients.push(`${singleLineProviderMatch[1]}.${singleLineProviderMatch[2]}`);
        continue;
      }

      const providerMatch = line.match(/^  '?([a-z0-9-]+)'?\?: \{$/);
      if (providerMatch) {
        provider = providerMatch[1];
        continue;
      }

      if (!provider) continue;

      const platformMatch = line.match(/^    '?([a-z0-9-]+)'?\?: Record/);
      if (platformMatch) typedClients.push(`${provider}.${platformMatch[1]}`);
      if (line === '  };') provider = undefined;
    }

    expect(typedClients.sort()).toEqual(getDataClients());
  });

  test('rawData exposes current top-level data shape', () => {
    expect(rawData).toHaveProperty('nicenames');
    expect(rawData).not.toHaveProperty('nice_names');
    expect(rawData.nicenames.category).toHaveProperty('others');
    expect(rawData.data.some((feature) => feature.category === 'others')).toBe(true);
  });

  test('getFeatures indexes all data categories', () => {
    const features = getFeatures();

    expect(features.css.size).toBeGreaterThan(0);
    expect(features.html.size).toBeGreaterThan(0);
    expect(features.image.size).toBeGreaterThan(0);
    expect(features.others.size).toBeGreaterThan(0);
    expect(features.others.has('AMP for Email')).toBe(true);
  });
});
