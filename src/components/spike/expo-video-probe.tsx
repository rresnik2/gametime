import { useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useRef } from 'react';
import { StyleSheet } from 'react-native';

import type { SpikeEvent, TestStream } from './test-streams';

type Props = { stream: TestStream; onEvent: (e: SpikeEvent) => void };

/** Plays one HLS stream with expo-video and reports status changes and the first frame. */
export function ExpoVideoProbe({ stream, onEvent }: Props) {
  const start = useRef(0); // set when the player starts, in the setup callback
  const log = (what: string) => onEvent({ ms: Date.now() - start.current, what });

  const player = useVideoPlayer({ uri: stream.url, contentType: 'hls' }, (p) => {
    start.current = Date.now();
    p.muted = true; // browsers only autoplay muted video
    p.play();
  });

  useEventListener(player, 'statusChange', ({ status, error }) => {
    log(`status: ${status}${error ? ` (${error.message})` : ''}`);
    // On web, play() in the setup callback is ignored before the source loads; start it here.
    if (status === 'readyToPlay') {
      if (!player.playing) player.play();
    }
  });
  useEventListener(player, 'playingChange', ({ isPlaying }) => log(isPlaying ? 'playing' : 'paused'));
  useEventListener(player, 'sourceLoad', () => log(`source loaded (isLive: ${player.isLive})`));

  return (
    <VideoView
      player={player}
      style={styles.video}
      contentFit="contain"
      nativeControls={false}
      onFirstFrameRender={() => log('FIRST FRAME')}
    />
  );
}

const styles = StyleSheet.create({
  video: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' },
});
