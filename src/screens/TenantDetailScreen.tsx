import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, Linking, ScrollView, Modal, TextInput,
} from 'react-native';
import { useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { getTenant, getRentRecordsForTenant, getDocuments, addDocument, deleteDocument, contractStatus, vacateTenant, unvacateTenant } from '../db/database';
import { Tenant, RentRecord, TenantDocument } from '../types';
import { RootStackParamList } from '../../App';

type Route = RouteProp<RootStackParamList, 'TenantDetail'>;

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const DOC_TYPES: { key: TenantDocument['type']; label: string }[] = [
  { key: 'id_card', label: 'ID Card' },
  { key: 'agreement', label: 'Agreement' },
  { key: 'other', label: 'Other' },
];

export default function TenantDetailScreen() {
  const { tenantId } = useRoute<Route>().params;
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [records, setRecords] = useState<RentRecord[]>([]);
  const [docs, setDocs] = useState<TenantDocument[]>([]);
  const [vacateModal, setVacateModal] = useState(false);
  const [vacateDate, setVacateDate] = useState(new Date().toISOString().split('T')[0]);

  const load = useCallback(() => {
    setTenant(getTenant(tenantId));
    setRecords(getRentRecordsForTenant(tenantId));
    setDocs(getDocuments(tenantId));
  }, [tenantId]);

  useFocusEffect(load);

  if (!tenant) return null;

  const totalPaid = records.reduce((s, r) => s + r.amount_paid, 0);
  const totalDue = records.reduce((s, r) => s + r.amount_due, 0);

  function handleVacate() {
    if (!tenant) return;
    if (!vacateDate.match(/^\d{4}-\d{2}-\d{2}$/)) { Alert.alert('Enter a valid date (YYYY-MM-DD)'); return; }
    vacateTenant(tenant.id, vacateDate);
    setVacateModal(false);
    load();
  }

  function handleUnvacate() {
    if (!tenant) return;
    Alert.alert('Mark as Active', `Restore ${tenant.name} as an active tenant?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Yes', onPress: () => { unvacateTenant(tenant.id); load(); } },
    ]);
  }

  async function pickImage(type: TenantDocument['type']) {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Allow photo library access to upload images.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (result.canceled) return;
    const asset = result.assets[0];
    const name = asset.fileName ?? `${type}_${Date.now()}.jpg`;
    addDocument({ tenant_id: tenantId, type, uri: asset.uri, name });
    load();
  }

  async function pickDocument(type: TenantDocument['type']) {
    const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
    if (result.canceled) return;
    const asset = result.assets[0];
    addDocument({ tenant_id: tenantId, type, uri: asset.uri, name: asset.name });
    load();
  }

  function showUploadOptions(type: TenantDocument['type']) {
    Alert.alert('Upload Document', 'Choose source', [
      { text: 'Photo Library', onPress: () => pickImage(type) },
      { text: 'Files / PDF', onPress: () => pickDocument(type) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  function confirmDelete(doc: TenantDocument) {
    Alert.alert('Delete Document', `Remove "${doc.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { deleteDocument(doc.id); load(); } },
    ]);
  }

  function openDoc(doc: TenantDocument) {
    Linking.openURL(doc.uri).catch(() => Alert.alert('Cannot open file'));
  }

  return (
    <ScrollView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.avatar}><Text style={s.avatarTxt}>{tenant.name[0].toUpperCase()}</Text></View>
        <Text style={s.name}>{tenant.name}</Text>
        {tenant.building ? <Text style={s.sub}>{tenant.building}</Text> : null}
        <Text style={s.sub}>Room {tenant.room} · ₹{tenant.monthly_rent.toLocaleString()}/mo</Text>
        {tenant.phone ? <Text style={s.sub}>{tenant.phone}</Text> : null}
        <Text style={s.sub}>Joined {tenant.move_in_date}</Text>
        <ContractBadge tenant={tenant} />
        {tenant.vacated_at
          ? (
            <View style={{ alignItems: 'center', marginTop: 8 }}>
              <View style={s.vacatedBadge}><Text style={s.vacatedBadgeTxt}>Vacated {tenant.vacated_at}</Text></View>
              <TouchableOpacity onPress={handleUnvacate} style={s.unvacateBtn}>
                <Text style={s.unvacateTxt}>Mark as Active</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={() => { setVacateDate(new Date().toISOString().split('T')[0]); setVacateModal(true); }} style={s.vacateBtn}>
              <Text style={s.vacateTxt}>Mark as Vacated</Text>
            </TouchableOpacity>
          )
        }
      </View>

      {/* Stats */}
      <View style={s.statsRow}>
        <Stat label="Total Paid" value={`₹${totalPaid.toLocaleString()}`} color="#22c55e" />
        <Stat label="Total Due" value={`₹${totalDue.toLocaleString()}`} color="#f97316" />
        <Stat label="Balance" value={`₹${(totalDue - totalPaid).toLocaleString()}`} color="#6366f1" />
      </View>

      {/* Documents */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Documents</Text>
        {DOC_TYPES.map(({ key, label }) => {
          const typeDocs = docs.filter(d => d.type === key);
          return (
            <View key={key} style={s.docGroup}>
              <View style={s.docGroupHeader}>
                <Text style={s.docGroupLabel}>{label}</Text>
                <TouchableOpacity style={s.uploadBtn} onPress={() => showUploadOptions(key)}>
                  <Text style={s.uploadBtnTxt}>+ Upload</Text>
                </TouchableOpacity>
              </View>
              {typeDocs.length === 0
                ? <Text style={s.noDoc}>No {label.toLowerCase()} uploaded</Text>
                : typeDocs.map(doc => (
                    <View key={doc.id} style={s.docRow}>
                      <TouchableOpacity style={{ flex: 1 }} onPress={() => openDoc(doc)}>
                        <Text style={s.docName} numberOfLines={1}>📎 {doc.name}</Text>
                        <Text style={s.docDate}>{doc.created_at.split('T')[0] || doc.created_at.slice(0, 10)}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => confirmDelete(doc)} style={s.docDelete}>
                        <Text style={{ color: '#ef4444', fontSize: 16 }}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))
              }
            </View>
          );
        })}
      </View>

      {/* Payment History */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Payment History</Text>
        {records.length === 0
          ? <Text style={s.empty}>No payment records yet.</Text>
          : records.map(item => (
              <View key={item.id} style={s.row}>
                <View style={{ flex: 1 }}>
                  <Text style={s.rowMonth}>{MONTHS[item.month - 1]} {item.year}</Text>
                  {item.notes ? <Text style={s.rowNote}>{item.notes}</Text> : null}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={s.rowAmt}>₹{item.amount_paid.toLocaleString()} / ₹{item.amount_due.toLocaleString()}</Text>
                  <View style={[s.badge, item.status === 'paid' ? s.badgePaid : item.status === 'partial' ? s.badgePartial : s.badgePending]}>
                    <Text style={s.badgeTxt}>{item.status}</Text>
                  </View>
                </View>
              </View>
            ))
        }
      </View>
      <Modal visible={vacateModal} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>Mark as Vacated</Text>
            <Text style={s.modalSub}>Records up to the previous month will remain. From the vacate month onwards, no new records will be generated.</Text>
            <Text style={s.modalLabel}>Vacate Date (YYYY-MM-DD)</Text>
            <TextInput style={s.modalInput} value={vacateDate} onChangeText={setVacateDate} placeholder="2024-07-01" />
            <View style={s.modalBtns}>
              <TouchableOpacity style={[s.modalBtn, { backgroundColor: '#e5e7eb' }]} onPress={() => setVacateModal(false)}>
                <Text style={{ color: '#374151', fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.modalBtn, { backgroundColor: '#ef4444' }]} onPress={handleVacate}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function ContractBadge({ tenant }: { tenant: Tenant }) {
  const cs = contractStatus(tenant);
  if (!cs) return null;
  const { daysLeft, endDate } = cs;
  const expired = daysLeft < 0;
  const soon = daysLeft >= 0 && daysLeft <= 30;
  const bg = expired ? '#fee2e2' : soon ? '#fef9c3' : '#dcfce7';
  const color = expired ? '#ef4444' : soon ? '#d97706' : '#16a34a';
  const label = expired
    ? `Contract expired ${Math.abs(daysLeft)}d ago (${endDate})`
    : daysLeft === 0
    ? `Contract expires today (${endDate})`
    : `Contract ends ${endDate} (${daysLeft}d left)`;
  return (
    <View style={[cb.badge, { backgroundColor: bg }]}>
      <Text style={[cb.txt, { color }]}>{label}</Text>
    </View>
  );
}

const cb = StyleSheet.create({
  badge: { marginTop: 8, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 5 },
  txt: { fontSize: 12, fontWeight: '600' },
});

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[s.stat, { borderColor: color }]}>
      <Text style={[s.statVal, { color }]}>{value}</Text>
      <Text style={s.statLbl}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { alignItems: 'center', backgroundColor: '#fff', paddingVertical: 20, borderBottomWidth: 1, borderColor: '#e5e7eb' },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#e0e7ff', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  avatarTxt: { fontSize: 28, fontWeight: '700', color: '#6366f1' },
  name: { fontSize: 20, fontWeight: '700', color: '#1f2937' },
  sub: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  statsRow: { flexDirection: 'row', padding: 12, gap: 8 },
  stat: { flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 2 },
  statVal: { fontSize: 14, fontWeight: '700' },
  statLbl: { fontSize: 10, color: '#6b7280', marginTop: 2 },
  section: { marginHorizontal: 12, marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 4 },
  docGroup: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  docGroupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  docGroupLabel: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  uploadBtn: { backgroundColor: '#e0e7ff', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  uploadBtnTxt: { fontSize: 13, color: '#6366f1', fontWeight: '600' },
  noDoc: { fontSize: 13, color: '#9ca3af' },
  docRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderTopWidth: 1, borderColor: '#f3f4f6' },
  docName: { fontSize: 13, color: '#374151', fontWeight: '500' },
  docDate: { fontSize: 11, color: '#9ca3af', marginTop: 1 },
  docDelete: { padding: 6 },
  row: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  rowMonth: { fontSize: 15, fontWeight: '600', color: '#1f2937' },
  rowNote: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  rowAmt: { fontSize: 13, fontWeight: '600', color: '#374151' },
  badge: { marginTop: 4, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  badgePaid: { backgroundColor: '#dcfce7' },
  badgePartial: { backgroundColor: '#fef9c3' },
  badgePending: { backgroundColor: '#fee2e2' },
  badgeTxt: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 20, fontSize: 14, marginBottom: 12 },
  vacateBtn: { marginTop: 10, borderWidth: 1, borderColor: '#fca5a5', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 },
  vacateTxt: { fontSize: 13, color: '#ef4444', fontWeight: '600' },
  vacatedBadge: { backgroundColor: '#fee2e2', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4 },
  vacatedBadgeTxt: { fontSize: 12, color: '#ef4444', fontWeight: '600' },
  unvacateBtn: { marginTop: 6, paddingHorizontal: 12, paddingVertical: 4 },
  unvacateTxt: { fontSize: 12, color: '#6366f1', fontWeight: '600' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#1f2937', marginBottom: 6 },
  modalSub: { fontSize: 13, color: '#6b7280', lineHeight: 19, marginBottom: 14 },
  modalLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  modalInput: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 10, fontSize: 15, marginBottom: 4 },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 16 },
  modalBtn: { flex: 1, padding: 14, borderRadius: 10, alignItems: 'center' },
});
