import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getTenants, deleteTenant, contractStatus } from '../db/database';
import { Tenant } from '../types';
import { RootStackParamList } from '../../App';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function TenantsScreen() {
  const nav = useNavigation<Nav>();
  const [tenants, setTenants] = useState<Tenant[]>([]);

  useFocusEffect(useCallback(() => {
    setTenants(getTenants());
  }, []));

  function confirmDelete(t: Tenant) {
    Alert.alert('Delete Tenant', `Remove ${t.name}? All rent records will be deleted.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { deleteTenant(t.id); setTenants(getTenants()); } },
    ]);
  }

  return (
    <View style={s.container}>
      <FlatList
        data={tenants}
        keyExtractor={t => String(t.id)}
        contentContainerStyle={{ padding: 12 }}
        ListEmptyComponent={<Text style={s.empty}>No tenants yet. Tap + to add one.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.card} onPress={() => nav.navigate('TenantDetail', { tenantId: item.id })}>
            <View style={s.avatar}><Text style={s.avatarTxt}>{item.name[0].toUpperCase()}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{item.name}</Text>
              <Text style={s.sub}>{item.building ? `${item.building} · ` : ''}Room {item.room} · ₹{item.monthly_rent.toLocaleString()}/mo</Text>
              {item.phone ? <Text style={s.phone}>{item.phone}</Text> : null}
              {item.vacated_at ? <Text style={s.vacated}>Vacated {item.vacated_at}</Text> : null}
              {(() => {
                const cs = contractStatus(item);
                if (!cs) return null;
                const expired = cs.daysLeft < 0;
                const soon = cs.daysLeft >= 0 && cs.daysLeft <= 30;
                if (!expired && !soon) return null;
                return (
                  <Text style={{ fontSize: 11, color: expired ? '#ef4444' : '#d97706', marginTop: 2, fontWeight: '600' }}>
                    {expired ? `⚠ Contract expired ${Math.abs(cs.daysLeft)}d ago` : `⚠ Contract ends in ${cs.daysLeft}d`}
                  </Text>
                );
              })()}
            </View>
            <View style={s.actions}>
              <TouchableOpacity onPress={() => nav.navigate('AddTenant', { tenant: item })} style={s.iconBtn}>
                <Text style={s.iconTxt}>✎</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => confirmDelete(item)} style={s.iconBtn}>
                <Text style={[s.iconTxt, { color: '#ef4444' }]}>✕</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />
      <TouchableOpacity style={s.fab} onPress={() => nav.navigate('AddTenant', {})}>
        <Text style={s.fabTxt}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#e0e7ff', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarTxt: { fontSize: 18, fontWeight: '700', color: '#6366f1' },
  name: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  sub: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  phone: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  actions: { flexDirection: 'row' },
  iconBtn: { padding: 8 },
  iconTxt: { fontSize: 18, color: '#6b7280' },
  vacated: { fontSize: 11, color: '#ef4444', fontWeight: '600', marginTop: 2 },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 80, fontSize: 14 },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#6366f1', justifyContent: 'center', alignItems: 'center', shadowColor: '#6366f1', shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },
  fabTxt: { fontSize: 28, color: '#fff', lineHeight: 32 },
});
