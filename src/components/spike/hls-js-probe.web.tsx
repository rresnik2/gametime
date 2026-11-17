import HlsPlayer, { Events } from 'hls.js';
import { useEffect, useRef } from 'react';

import type { SpikeEvent, TestStream } from './test-streams';

type Props = { stream: TestStream; onEvent: (e: SpikeEvent) => void };

/**
 * Web only: plays one HLS stream in a plain <video>, natively if the browser can (Safari), else
 * with hls.js (MSE). Compared against expo-video on web in the spike.
 */
export function HlsJsProbe({ stream, onEvent }: Props) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const start = Date.now();
    const log = (what: string) => onEvent({ ms: Date.now() - start, what });
    // ?hlsjs forces hls.js even where the browser plays HLS natively (to test the Firefox path).
    const forceHlsJs = new URLSearchParams(window.location.search).has('hlsjs');
    const native = !forceHlsJs && video.canPlayType('application/vnd.apple.mpegurl') !== '';
    let hls: HlsPlayer | null = null;

    const onLoaded = () => log('FIRST FRAME (loadeddata)');
    const onPlaying = () => log('playing');
    const onError = () => log(`video error: ${video.error?.message || video.error?.code}`);
    video.addEventListener('loadeddata', onLoaded);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('error', onError);

    if (native) {
      log('native HLS');
      video.src = stream.url;
    }
    // hls.js's types only expose isSupported as a static method.
    // eslint-disable-next-line import/no-named-as-default-member
    else if (HlsPlayer.isSupported()) {
      log('hls.js');
      hls = new HlsPlayer({ lowLatencyMode: true });
      hls.on(Events.MANIFEST_PARSED, () => log('manifest parsed'));
      hls.on(Events.ERROR, (_e, data) => data.fatal && log(`hls.js fatal: ${data.details}`));
      hls.loadSource(stream.url);
      hls.attachMedia(video);
    } else {
      log('no HLS support');
    }
    video.muted = true;
    video.play().catch((e) => log(`play() rejected: ${e.name}`));

    return () => {
      video.removeEventListener('loadeddata', onLoaded);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('error', onError);
      hls?.destroy();
      video.removeAttribute('src');
      video.load();
    };
  }, [stream, onEvent]);

  return <video ref={ref} playsInline muted style={{ width: '100%', aspectRatio: '16 / 9', background: '#000' }} />;
}
