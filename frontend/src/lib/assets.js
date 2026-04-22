const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export function resolveAssetUrl(assetPath) {
  if (!assetPath) {
    return null;
  }

  if (/^https?:\/\//i.test(assetPath)) {
    return assetPath;
  }

  const origin = apiBaseUrl.replace(/\/api\/?$/, '');
  return `${origin}${assetPath.startsWith('/') ? assetPath : `/${assetPath}`}`;
}
