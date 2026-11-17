/**
 * Public HLS test streams for the D1 playback spike (decision 001). None of these are ours; they
 * stand in for a provider's playback URL until a Mux or IVS account exists.
 */
export type TestStream = { id: string; label: string; url: string; live: boolean };

export const TEST_STREAMS: TestStream[] = [
  {
    id: 'live',
    label: 'Live (Unified Streaming demo)',
    url: 'https://demo.unified-streaming.com/k8s/live/scte35.isml/.m3u8',
    live: true,
  },
  {
    id: 'vod-mux',
    label: 'VOD (Mux test stream)',
    url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    live: false,
  },
  {
    id: 'vod-apple',
    label: 'VOD (Apple bipbop, TS)',
    url: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_ts/master.m3u8',
    live: false,
  },
];

/** One line of the timing log: milliseconds since the source was set, and what happened. */
export type SpikeEvent = { ms: number; what: string };
