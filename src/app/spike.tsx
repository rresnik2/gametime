import { useCallback, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ExpoVideoProbe } from '@/components/spike/expo-video-probe';
import { HlsJsProbe } from '@/components/spike/hls-js-probe';
import { TEST_STREAMS, type SpikeEvent, type TestStream } from '@/components/spike/test-streams';
import { AppText } from '@/components/ui/app-text';
import { colors, radius, spacing } from '@/theme/tokens';

/**
 * D1 playback spike (decision 001): open /spike to play public HLS test streams and time the
 * first frame. Not linked from the app; remove or keep as a diagnostic when Phase 2's player lands.
 */
export default function SpikeScreen() {
  const [stream, setStream] = useState<TestStream>(TEST_STREAMS[0]);
  const [run, setRun] = useState(0); // remounts the players to re-measure
  const [expoLog, setExpoLog] = useState<SpikeEvent[]>([]);
  const [hlsLog, setHlsLog] = useState<SpikeEvent[]>([]);

  const onExpo = useCallback((e: SpikeEvent) => {
    console.log(`[spike] expo-video ${e.ms}ms ${e.what}`);
    setExpoLog((l) => [...l, e]);
  }, []);
  const onHls = useCallback((e: SpikeEvent) => {
    console.log(`[spike] hls.js ${e.ms}ms ${e.what}`);
    setHlsLog((l) => [...l, e]);
  }, []);

  const choose = (s: TestStream) => {
    setExpoLog([]);
    setHlsLog([]);
    setStream(s);
    setRun((r) => r + 1);
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <AppText variant="title">Playback spike</AppText>
        <AppText color="textSecondary">
          {Platform.OS} · public HLS test streams · tap a stream to re-measure
        </AppText>
        <View style={styles.row}>
          {TEST_STREAMS.map((s) => (
            <Pressable
              key={s.id}
              onPress={() => choose(s)}
              accessibilityRole="button"
              style={[styles.chip, s.id === stream.id && styles.chipOn]}>
              <AppText variant="caption">{s.label}</AppText>
            </Pressable>
          ))}
        </View>

        <AppText variant="bodyStrong">expo-video</AppText>
        <ExpoVideoProbe key={`expo-${run}-${stream.id}`} stream={stream} onEvent={onExpo} />
        <Log events={expoLog} />

        {Platform.OS === 'web' && (
          <>
            <AppText variant="bodyStrong">&lt;video&gt; + hls.js</AppText>
            <HlsJsProbe key={`hls-${run}-${stream.id}`} stream={stream} onEvent={onHls} />
            <Log events={hlsLog} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Log({ events }: { events: SpikeEvent[] }) {
  return (
    <View style={styles.log} testID="spike-log">
      {events.length === 0 && <AppText color="textSecondary">waiting…</AppText>}
      {events.map((e, i) => (
        <AppText key={i} variant="caption">
          {`${String(e.ms).padStart(5)} ms  ${e.what}`}
        </AppText>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md, maxWidth: 720, width: '100%', alignSelf: 'center' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipOn: { borderColor: colors.primary },
  log: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, gap: spacing.xxs },
});
