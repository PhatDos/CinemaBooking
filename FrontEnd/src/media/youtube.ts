export function getYouTubeVideoId(value?: string | null) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null;
    }

    if (host === 'youtu.be') {
      return cleanVideoId(url.pathname.slice(1));
    }

    if (!['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(host)) {
      return null;
    }

    if (url.pathname === '/watch') {
      return cleanVideoId(url.searchParams.get('v'));
    }

    if (url.pathname.startsWith('/shorts/') ||
        url.pathname.startsWith('/embed/')) {
      return cleanVideoId(url.pathname.split('/')[2]);
    }

    return null;
  } catch {
    return null;
  }
}

function cleanVideoId(value?: string | null) {
  const trimmed = value?.trim();

  return trimmed || null;
}
