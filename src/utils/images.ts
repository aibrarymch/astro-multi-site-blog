import type { ImageMetadata } from 'astro';

// src/配下の全画像をglobでプリロード（ビルド時に一度だけ解決）
const images = import.meta.glob<{ default: ImageMetadata }>(
  '/src/**/*.{jpeg,jpg,png,gif,webp,svg,avif}'
);

/**
 * 相対パス文字列からImageMetadataを解決する
 * @param src 画像パス（相対パスまたはURL）
 * @returns { resolvedSrc, isRemote }
 */
export async function resolveImage(
  src: ImageMetadata | string
): Promise<{ resolvedSrc: ImageMetadata | string; isRemote: boolean }> {
  if (typeof src !== 'string') {
    return { resolvedSrc: src, isRemote: false };
  }

  const isRemote = src.startsWith('http://') || src.startsWith('https://');
  // /で始まるパス（public配下）もリモート扱い（inferSizeで対応）
  const isPublicPath = src.startsWith('/');

  if (isRemote || isPublicPath) {
    return { resolvedSrc: src, isRemote: true };
  }

  // パスの末尾部分でマッチング
  const searchPath = src.replace(/^\./, '');
  const matchingEntry = Object.entries(images).find(([path]) =>
    path.endsWith(searchPath)
  );

  if (matchingEntry) {
    const imageModule = await matchingEntry[1]();
    return { resolvedSrc: imageModule.default, isRemote: false };
  }

  return { resolvedSrc: src, isRemote: false };
}
