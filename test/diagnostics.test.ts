import { describe, expect, test } from 'vitest';

import { caniemail } from '../dist/index.js';

const issueTitles = (result: ReturnType<typeof caniemail>) =>
  [
    ...[...result.issues.errors.values()].flat(),
    ...[...result.issues.warnings.values()].flat()
  ].map((issue) => issue.title);

describe('new diagnostics', () => {
  test('detects AMP for Email from html attributes', () => {
    const result = caniemail({
      clients: ['outlook.windows'],
      html: '<!doctype html><html amp4email><body></body></html>'
    });

    expect(issueTitles(result)).toContain('AMP for Email');
  });

  test('detects color-scheme meta tag', () => {
    const result = caniemail({
      clients: ['outlook.windows'],
      html: '<!doctype html><html><head><meta name="color-scheme" content="light dark"></head></html>'
    });

    expect(issueTitles(result)).toContain('color-scheme meta tag');
  });

  test('detects grouped CSS features', () => {
    const result = caniemail({
      clients: ['outlook.windows'],
      css: `
        .grid {
          color-scheme: light dark;
          display: grid;
          gap: 1rem;
          grid-template-columns: 1fr 1fr;
          font-family: system-ui;
        }
      `
    });

    expect(issueTitles(result)).toEqual(
      expect.arrayContaining([
        'color-scheme CSS property',
        'display:grid',
        'gap, column-gap, row-gap',
        'grid-template-* properties',
        'system-ui, ui-serif, ui-sans-serif, ui-rounded, ui-monospace'
      ])
    );
  });

  test('detects CSS comments and CSS nesting when parser exposes them', () => {
    const comments = caniemail({
      clients: ['gmail.mobile-webmail'],
      css: '.parent { /* preserved */ color: red; }'
    });
    const nesting = caniemail({
      clients: ['gmail.mobile-webmail'],
      css: `
        .parent {
          & .child { color: red; }
        }
      `
    });

    expect(issueTitles(comments)).toContain('CSS comments');
    expect(issueTitles(nesting)).toContain('CSS Nesting');
  });

  test('detects image formats from html and css references', () => {
    const result = caniemail({
      clients: ['outlook.windows'],
      html: `
        <picture>
          <source srcset="hero.avif 1x, hero@2x.avif 2x">
          <img src="fallback.webp">
        </picture>
        <div style="background-image: url(data:image/avif;base64,AAAA)"></div>
      `
    });

    expect(issueTitles(result)).toContain('AVIF image format');
  });
});
