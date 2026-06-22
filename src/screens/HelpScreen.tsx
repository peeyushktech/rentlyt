import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const steps = [
  {
    icon: '👤',
    title: 'Add your tenants',
    desc: 'Go to the Tenants tab and tap +. Enter their name, building, room number, monthly rent, and move-in date. Optionally set a contract tenure so you get renewal alerts.',
  },
  {
    icon: '📄',
    title: 'Upload documents',
    desc: 'Tap any tenant to open their profile. Upload their ID card and rental agreement directly from your photo library or files app.',
  },
  {
    icon: '📅',
    title: 'Track rent month by month',
    desc: 'The Dashboard shows last month\'s rent status for all tenants. Use ‹ › to move between months. Tap a tenant row to mark their rent as paid or revert it if needed.',
  },
  {
    icon: '⚠️',
    title: 'Contract renewals',
    desc: 'If you set a contract tenure, Rentlyt will warn you when a contract is expiring soon or has already expired — visible on the tenant card and their profile.',
  },
  {
    icon: '📊',
    title: 'See the full picture',
    desc: 'Each tenant\'s profile shows total collected, total due, balance, and a full payment history so you always know where things stand.',
  },
];

export default function HelpScreen() {
  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>

      <View style={s.privacyCard}>
        <Text style={s.privacyIcon}>🔒</Text>
        <Text style={s.privacyTitle}>Your data stays on your phone</Text>
        <Text style={s.privacyDesc}>
          Rentlyt stores everything — tenants, rent records, and uploaded documents — locally on your device. Nothing is sent to any server. Uninstalling the app will erase all data, so back up your phone regularly.
        </Text>
      </View>

      <Text style={s.sectionTitle}>How to use Rentlyt</Text>

      {steps.map((step, i) => (
        <View key={i} style={s.step}>
          <View style={s.stepLeft}>
            <Text style={s.stepIcon}>{step.icon}</Text>
          </View>
          <View style={s.stepRight}>
            <Text style={s.stepTitle}>{step.title}</Text>
            <Text style={s.stepDesc}>{step.desc}</Text>
          </View>
        </View>
      ))}

      <View style={s.footer}>
        <Text style={s.footerText}>Manage smarter. Collect faster. Stress less.</Text>
        <Text style={s.version}>Rentlyt v1.0</Text>
      </View>

    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 40 },

  privacyCard: {
    backgroundColor: '#eef2ff',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  privacyIcon: { fontSize: 28, marginBottom: 8 },
  privacyTitle: { fontSize: 15, fontWeight: '700', color: '#3730a3', marginBottom: 6, textAlign: 'center' },
  privacyDesc: { fontSize: 13, color: '#4338ca', lineHeight: 20, textAlign: 'center' },

  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 14 },

  step: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  stepLeft: { width: 40, alignItems: 'center', paddingTop: 2 },
  stepIcon: { fontSize: 22 },
  stepRight: { flex: 1 },
  stepTitle: { fontSize: 15, fontWeight: '600', color: '#1f2937', marginBottom: 4 },
  stepDesc: { fontSize: 13, color: '#6b7280', lineHeight: 19 },

  footer: { alignItems: 'center', marginTop: 24 },
  footerText: { fontSize: 13, color: '#9ca3af', textAlign: 'center' },
  version: { fontSize: 12, color: '#d1d5db', marginTop: 4 },
});
