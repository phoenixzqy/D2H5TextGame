/** Resolve authored public asset paths under the deployment's Vite base path. */
export function publicAssetUrl(url: string | null | undefined): string | undefined {
  if (url == null) return undefined;
  if (!url.startsWith('/') || url.startsWith('//')) return url;
  return `${import.meta.env.BASE_URL}${url.slice(1)}`;
}
