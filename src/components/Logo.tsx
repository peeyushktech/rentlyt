import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Logo() {
  return (
    <View style={s.row}>
      <View style={s.icon}>
        <View style={s.roof} />
        <View style={s.body}>
          <View style={s.door} />
        </View>
      </View>
      <Text style={s.wordmark}>
        <Text style={s.rent}>Rent</Text>
        <Text style={s.easy}>lyt</Text>
      </Text>
    </View>
  );
}

const INDIGO = '#6366f1';
const DARK = '#1f2937';

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  icon: { width: 28, height: 28, alignItems: 'center', justifyContent: 'flex-end' },

  roof: {
    width: 0, height: 0,
    borderLeftWidth: 14, borderRightWidth: 14, borderBottomWidth: 10,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    borderBottomColor: INDIGO,
    marginBottom: 0,
  },
  body: {
    width: 20, height: 14,
    backgroundColor: INDIGO,
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderRadius: 1,
  },
  door: {
    width: 7, height: 9,
    backgroundColor: '#fff',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },

  wordmark: { fontSize: 20, letterSpacing: -0.3 },
  rent: { fontWeight: '700', color: DARK },
  easy: { fontWeight: '400', color: INDIGO },
});
