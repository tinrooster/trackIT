/**
 * Ensures a URL has a protocol (https:// by default)
 * @param url The URL to check and potentially modify
 * @returns The URL with protocol
 */
export const ensureUrlProtocol = (url: string): string => {
  if (!url) return url;
  if (!/^https?:\/\//i.test(url)) {
    return `https://${url}`;
  }
  return url;
}; 