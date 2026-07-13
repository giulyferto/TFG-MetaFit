let _pendingImagenUrl: string | null = null;

export function setPendingImagenUrl(url: string | null) {
  _pendingImagenUrl = url;
}

export function consumePendingImagenUrl(): string | null {
  const url = _pendingImagenUrl;
  _pendingImagenUrl = null;
  return url;
}
