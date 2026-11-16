import Ionicons from '@expo/vector-icons/Ionicons';
import { TabList, TabSlot, TabTrigger, Tabs, type TabTriggerSlotProps } from 'expo-router/ui';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { colors, minTouchTarget, radius, sidebarBreakpoint, spacing } from '@/theme/tokens';

type IconName = ComponentProps<typeof Ionicons>['name'];

type TabDef = {
  name: string;
  href: '/' | '/discover' | '/go-live' | '/squads' | '/profile';
  label: string;
  icon: IconName;
  iconFocused: IconName;
};

// The five tabs from the product plan. Squads is a v2 feature; for the MVP it shows a placeholder.
const TABS: TabDef[] = [
  { name: 'index', href: '/', label: 'Live', icon: 'play-outline', iconFocused: 'play' },
  {
    name: 'discover',
    href: '/discover',
    label: 'Discover',
    icon: 'search-outline',
    iconFocused: 'search',
  },
  { name: 'go-live', href: '/go-live', label: 'Go Live', icon: 'add', iconFocused: 'add' },
  {
    name: 'squads',
    href: '/squads',
    label: 'Squads',
    icon: 'people-outline',
    iconFocused: 'people',
  },
  {
    name: 'profile',
    href: '/profile',
    label: 'Profile',
    icon: 'person-outline',
    iconFocused: 'person',
  },
];

/**
 * Bottom tab bar on phones; left sidebar on web and tablet (>= 768px wide),
 * as described in the plan's "App structure" section.
 */
export function AppTabs() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const sidebar = width >= sidebarBreakpoint;

  return (
    <Tabs style={[styles.root, sidebar && styles.rootSidebar]}>
      <TabSlot style={styles.slot} />
      <TabList
        style={
          sidebar
            ? styles.sidebar
            : [styles.bottomBar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]
        }>
        {sidebar && (
          <AppText variant="title" style={styles.wordmark}>
            GameTime
          </AppText>
        )}
        {TABS.map((tab) => (
          <TabTrigger key={tab.name} name={tab.name} href={tab.href} asChild>
            {tab.name === 'go-live' ? (
              <GoLiveButton tab={tab} sidebar={sidebar} />
            ) : (
              <TabButton tab={tab} sidebar={sidebar} />
            )}
          </TabTrigger>
        ))}
      </TabList>
    </Tabs>
  );
}

// `ref` is dropped because expo-router's slot ref type doesn't match React Native 0.88's
// View ref type yet; the trigger doesn't need the ref to work.
type ButtonProps = Omit<TabTriggerSlotProps, 'ref'> & { tab: TabDef; sidebar: boolean };

function TabButton({ tab, sidebar, isFocused, ...props }: ButtonProps) {
  const tint = isFocused ? colors.primary : colors.textSecondary;
  return (
    <Pressable
      {...props}
      accessibilityRole="tab"
      accessibilityLabel={tab.label}
      accessibilityState={{ selected: isFocused }}
      style={[styles.tab, sidebar && styles.tabSidebar, isFocused && sidebar && styles.tabActive]}>
      <Ionicons name={isFocused ? tab.iconFocused : tab.icon} size={24} color={tint} />
      <AppText variant="caption" style={{ color: tint }}>
        {tab.label}
      </AppText>
    </Pressable>
  );
}

/** Center "+" button. Later it gets a pulsing red-violet ring while the user is live. */
function GoLiveButton({ tab, sidebar, isFocused, ...props }: ButtonProps) {
  return (
    <Pressable
      {...props}
      accessibilityRole="tab"
      accessibilityLabel="Go live"
      accessibilityState={{ selected: isFocused }}
      style={[styles.tab, sidebar && styles.tabSidebar]}>
      <View style={[styles.goLive, isFocused && styles.goLiveFocused]}>
        <Ionicons name="add" size={28} color={colors.text} />
      </View>
      {sidebar && <AppText variant="caption">{tab.label}</AppText>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  rootSidebar: { flexDirection: 'row-reverse' },
  slot: { flex: 1 },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  sidebar: {
    width: 220,
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    gap: spacing.xs,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.border,
  },
  wordmark: { paddingHorizontal: spacing.md, marginBottom: spacing.lg },
  tab: {
    minWidth: minTouchTarget,
    minHeight: minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxs,
  },
  tabSidebar: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  tabActive: { backgroundColor: colors.surface },
  goLive: {
    width: 48,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.live,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goLiveFocused: { borderColor: colors.text },
});
