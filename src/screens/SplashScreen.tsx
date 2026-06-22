import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

export default function AppSplashScreen({ onDone }: { onDone: () => void }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 350, useNativeDriver: true }).start(onDone);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={s.container}>
      <Animated.View style={[s.content, { opacity, transform: [{ scale }] }]}>
        <View style={s.iconWrap}>
          <View style={s.roof} />
          <View style={s.body}>
            <View style={s.door} />
          </View>
        </View>
        <Text style={s.wordmark}>
          <Text style={s.rent}>Rent</Text>
          <Text style={s.lyt}>lyt</Text>
        </Text>
        <Text style={s.tagline}>Manage smarter. Collect faster.{'\n'}Stress less.</Text>
      </Animated.View>
    </View>
  );
}

const INDIGO = '#6366f1';

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  content: { alignItems: 'center' },

  iconWrap: { width: 72, height: 72, alignItems: 'center', justifyContent: 'flex-end', marginBottom: 16 },
  roof: {
    width: 0, height: 0,
    borderLeftWidth: 36, borderRightWidth: 36, borderBottomWidth: 26,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    borderBottomColor: INDIGO,
  },
  body: {
    width: 52, height: 36,
    backgroundColor: INDIGO,
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderRadius: 2,
  },
  door: {
    width: 18, height: 24,
    backgroundColor: '#fff',
    borderTopLeftRadius: 9,
    borderTopRightRadius: 9,
  },

  wordmark: { fontSize: 42, letterSpacing: -1 },
  rent: { fontWeight: '700', color: '#1f2937' },
  lyt: { fontWeight: '300', color: INDIGO },

  tagline: { fontSize: 15, color: '#9ca3af', textAlign: 'center', lineHeight: 24, marginTop: 12 },
});
