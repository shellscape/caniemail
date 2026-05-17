import { getFeatures } from './features.js';

const features = getFeatures().image;

const formatTitles: Record<string, string> = {
  apng: 'Animated PNG image format',
  avif: 'AVIF image format',
  bmp: 'BMP image format',
  gif: 'GIF image format',
  heic: 'HEIF image format',
  heif: 'HEIF image format',
  ico: 'ICO image format',
  jpeg: 'JPG image format',
  jpg: 'JPG image format',
  png: 'PNG image format',
  svg: 'SVG image format',
  tif: 'TIFF image format',
  tiff: 'TIFF image format',
  webp: 'webP image format'
};

const mimeTitles: Record<string, string> = {
  'image/apng': 'Animated PNG image format',
  'image/avif': 'AVIF image format',
  'image/bmp': 'BMP image format',
  'image/gif': 'GIF image format',
  'image/heic': 'HEIF image format',
  'image/heif': 'HEIF image format',
  'image/jpeg': 'JPG image format',
  'image/jpg': 'JPG image format',
  'image/png': 'PNG image format',
  'image/svg+xml': 'SVG image format',
  'image/tiff': 'TIFF image format',
  'image/vnd.microsoft.icon': 'ICO image format',
  'image/webp': 'webP image format'
};

const getUrlFormatTitle = (url: string) => {
  const dataUriMime = /^data:([^;,]+)/i.exec(url.trim())?.[1]?.toLowerCase();
  if (dataUriMime) return mimeTitles[dataUriMime];

  const path = url.split(/[?#]/, 1)[0]!;
  const extension = /\.([a-z0-9]+)$/i.exec(path)?.[1]?.toLowerCase();
  if (!extension) return undefined;

  return formatTitles[extension];
};

export const getMatchingImageTitles = ({ urls }: { urls: string[] }) => {
  const titles = new Set<string>();

  for (const url of urls) {
    const title = getUrlFormatTitle(url);
    if (title && features.has(title)) titles.add(title);
  }

  return [...titles];
};

export const getUrlsFromSrcset = (srcset: string) =>
  srcset
    .split(',')
    .map((candidate) => candidate.trim().split(/\s+/, 1)[0])
    .filter((url) => url !== undefined && url !== '');

export const getUrlsFromCssValue = (value: string) =>
  [...value.matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/gi)]
    .map((match) => match[2]?.trim())
    .filter((url) => url !== undefined && url !== '');
