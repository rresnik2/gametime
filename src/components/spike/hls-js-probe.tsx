import type { SpikeEvent, TestStream } from './test-streams';

type Props = { stream: TestStream; onEvent: (e: SpikeEvent) => void };

/** hls.js only runs on web (see hls-js-probe.web.tsx); native platforms use expo-video. */
export function HlsJsProbe(_props: Props) {
  return null;
}
