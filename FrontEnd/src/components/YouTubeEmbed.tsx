import YoutubePlayer from 'react-native-youtube-iframe';

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
  return (
    <YoutubePlayer
      height={height}
      play={play}
      videoId={videoId}
    />
  );
}
