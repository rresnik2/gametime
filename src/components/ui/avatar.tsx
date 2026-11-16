import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { colors } from '@/theme/tokens';

import { AppText } from './app-text';

export type AvatarProps = {
  username: string;
  uri?: string | null;
  size?: number;
};

export function Avatar({ username, uri, size = 40 }: AvatarProps) {
  const shape = { width: size, height: size, borderRadius: size / 2 };
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.base, shape]}
        accessibilityLabel={`${username}'s avatar`}
      />
    );
  }
  return (
    <View
      style={[styles.base, styles.fallback, shape]}
      accessible
      accessibilityLabel={`${username}'s avatar`}>
      <AppText variant="bodyStrong" style={{ fontSize: size * 0.4, lineHeight: size * 0.5 }}>
        {username.charAt(0).toUpperCase()}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { borderWidth: 2, borderColor: colors.text },
  fallback: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
