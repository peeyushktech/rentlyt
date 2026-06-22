import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { addTenant, updateTenant } from '../db/database';
import { RootStackParamList } from '../../App';

type Route = RouteProp<RootStackParamList, 'AddTenant'>;

export default function AddTenantScreen() {
  const nav = useNavigation();
  const route = useRoute<Route>();
  const existing = route.params?.tenant;

  const [name, setName] = useState(existing?.name ?? '');
  const [phone, setPhone] = useState(existing?.phone ?? '');
  const [building, setBuilding] = useState(existing?.building ?? '');
  const [room, setRoom] = useState(existing?.room ?? '');
  const [rent, setRent] = useState(existing ? String(existing.monthly_rent) : '');
  const [moveIn, setMoveIn] = useState(existing?.move_in_date ?? new Date().toISOString().split('T')[0]);
  const [contractMonths, setContractMonths] = useState(existing?.contract_months ? String(existing.contract_months) : '');

  function save() {
    if (!name.trim()) { Alert.alert('Name is required'); return; }
    if (!room.trim()) { Alert.alert('Room is required'); return; }
    const rentAmt = parseFloat(rent);
    if (isNaN(rentAmt) || rentAmt <= 0) { Alert.alert('Enter a valid rent amount'); return; }
    const cm = contractMonths.trim() ? parseInt(contractMonths, 10) : 0;
    const data = { name: name.trim(), phone: phone.trim(), building: building.trim(), room: room.trim(), monthly_rent: rentAmt, move_in_date: moveIn, contract_months: isNaN(cm) ? 0 : cm, vacated_at: existing?.vacated_at ?? null };
    if (existing) { updateTenant(existing.id, data); } else { addTenant(data); }
    nav.goBack();
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={s.container} contentContainerStyle={{ padding: 20 }}>
        <Field label="Full Name *" value={name} onChange={setName} placeholder="e.g. Ravi Kumar" />
        <Field label="Phone" value={phone} onChange={setPhone} placeholder="e.g. 9876543210" keyboardType="phone-pad" />
        <Field label="Building" value={building} onChange={setBuilding} placeholder="e.g. Sunrise Apartments" />
        <Field label="Room / Unit *" value={room} onChange={setRoom} placeholder="e.g. 2B" />
        <Field label="Monthly Rent (₹) *" value={rent} onChange={setRent} placeholder="e.g. 8000" keyboardType="numeric" />
        <Field label="Move-in Date (YYYY-MM-DD)" value={moveIn} onChange={setMoveIn} placeholder="2024-01-01" />
        <Field label="Contract Tenure (months, optional)" value={contractMonths} onChange={setContractMonths} placeholder="e.g. 11" keyboardType="numeric" />
        <TouchableOpacity style={s.saveBtn} onPress={save}>
          <Text style={s.saveTxt}>{existing ? 'Update Tenant' : 'Add Tenant'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, value, onChange, placeholder, keyboardType }: any) {
  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      <TextInput style={s.input} value={value} onChangeText={onChange} placeholder={placeholder} keyboardType={keyboardType ?? 'default'} />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 12, fontSize: 15 },
  saveBtn: { backgroundColor: '#6366f1', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  saveTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
