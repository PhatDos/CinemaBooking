import { createElement } from 'react';

type YouTubeEmbedProps = {
  height: number;
  play?: boolean;
  videoId: string;
};

export function YouTubeEmbed({
  height,
  play = false,
  videoId,
}: YouTubeEmbedProps) {
  const query = play ? '?autoplay=1' : '';

  return createElement('iframe', {
    allow:
      'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
    allowFullScreen: true,
    height,
    src: `https://www.youtube.com/embed/${videoId}${query}`,
    style: {
      border: 0,
      display: 'block',
      height,
      width: '100%',
    },
    title: 'YouTube video player',
    width: '100%',
  });
}
