import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getDashboardStats, markRentPaid } from '../db/database';
import { RentRecord } from '../types';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function DashboardScreen() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [stats, setStats] = useState<ReturnType<typeof getDashboardStats> | null>(null);
  const [selected, setSelected] = useState<RentRecord | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [notes, setNotes] = useState('');

  const load = useCallback(() => {
    setStats(getDashboardStats(month, year));
  }, [month, year]);

  useFocusEffect(load);

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  function openModal(item: RentRecord) {
    setSelected(item);
    setPayAmount(String(item.amount_due));
    setNotes(item.notes ?? '');
  }

  function closeModal() {
    setSelected(null);
    setPayAmount('');
    setNotes('');
  }

  function handleMarkPaid() {
    if (!selected) return;
    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) {
      // fall back to full amount if field is blank/zero
      markRentPaid(selected.id, selected.amount_due, notes || undefined);
    } else {
      markRentPaid(selected.id, amt, notes || undefined);
    }
    closeModal();
    load();
  }

  function handleMarkUnpaid() {
    if (!selected) return;
    markRentPaid(selected.id, 0, undefined);
    closeModal();
    load();
  }

  const alreadyPaid = selected?.status === 'paid' || selected?.status === 'partial';

  if (!stats) return null;

  return (
    <View style={s.container}>
      <View style={s.monthRow}>
        <TouchableOpacity onPress={prevMonth} style={s.arrow}><Text style={s.arrowTxt}>‹</Text></TouchableOpacity>
        <Text style={s.monthLabel}>{MONTHS[month - 1]} {year}</Text>
        <TouchableOpacity onPress={nextMonth} style={s.arrow}><Text style={s.arrowTxt}>›</Text></TouchableOpacity>
      </View>

      <View style={s.cardRow}>
        <View style={[s.card, { borderColor: '#22c55e' }]}>
          <Text style={s.cardAmt}>₹{stats.totalPaid.toLocaleString()}</Text>
          <Text style={s.cardLbl}>Collected</Text>
        </View>
        <View style={[s.card, { borderColor: '#f97316' }]}>
          <Text style={s.cardAmt}>₹{(stats.totalDue - stats.totalPaid).toLocaleString()}</Text>
          <Text style={s.cardLbl}>Pending</Text>
        </View>
        <View style={[s.card, { borderColor: '#6366f1' }]}>
          <Text style={s.cardAmt}>{stats.paidCount}/{stats.paidCount + stats.pendingCount}</Text>
          <Text style={s.cardLbl}>Paid</Text>
        </View>
      </View>

      <FlatList
        data={stats.records}
        keyExtractor={r => String(r.id)}
        contentContainerStyle={{ padding: 12 }}
        ListEmptyComponent={<Text style={s.empty}>No tenants yet. Add one in the Tenants tab.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.row} onPress={() => openModal(item)}>
            <View style={{ flex: 1 }}>
              <Text style={s.rowName}>{item.tenant_name}</Text>
              <Text style={s.rowRoom}>Room {item.room} · Joined {item.move_in_date}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={s.rowAmt}>₹{item.amount_due.toLocaleString()}</Text>
              <View style={[s.badge, item.status === 'paid' ? s.badgePaid : item.status === 'partial' ? s.badgePartial : s.badgePending]}>
                <Text style={s.badgeTxt}>{item.status}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />

      <Modal visible={!!selected} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>{selected?.tenant_name} — Room {selected?.room}</Text>
            <Text style={s.modalSub}>
              {MONTHS[month - 1]} rent · Due ₹{selected?.amount_due.toLocaleString()}
              {alreadyPaid ? `  ·  Paid ₹${selected?.amount_paid.toLocaleString()}` : ''}
            </Text>

            {/* Only show amount/notes fields when marking as paid */}
            {!alreadyPaid && (
              <>
                <Text style={s.label}>Amount Received (₹)</Text>
                <TextInput
                  style={s.input}
                  value={payAmount}
                  onChangeText={setPayAmount}
                  keyboardType="numeric"
                  placeholder={String(selected?.amount_due ?? '')}
                />
                <Text style={s.label}>Notes (optional)</Text>
                <TextInput
                  style={s.input}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="e.g. UPI, cash..."
                />
              </>
            )}

            <View style={s.modalBtns}>
              <TouchableOpacity style={[s.btn, s.btnCancel]} onPress={closeModal}>
                <Text style={s.btnCancelTxt}>Cancel</Text>
              </TouchableOpacity>

              {alreadyPaid ? (
                <TouchableOpacity style={[s.btn, s.btnUnpaid]} onPress={handleMarkUnpaid}>
                  <Text style={s.btnUnpaidTxt}>Mark Not Paid</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={[s.btn, s.btnPaid]} onPress={handleMarkPaid}>
                  <Text style={s.btnPaidTxt}>Mark Paid</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e5e7eb' },
  arrow: { padding: 12 },
  arrowTxt: { fontSize: 28, color: '#6366f1' },
  monthLabel: { fontSize: 18, fontWeight: '600', width: 130, textAlign: 'center' },
  cardRow: { flexDirection: 'row', padding: 12, gap: 8 },
  card: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 2 },
  cardAmt: { fontSize: 15, fontWeight: '700', color: '#1f2937' },
  cardLbl: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  row: { flexDirection: 'row', backgroundColor: '#fff', marginBottom: 8, padding: 14, borderRadius: 10, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  rowName: { fontSize: 15, fontWeight: '600', color: '#1f2937' },
  rowRoom: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  rowAmt: { fontSize: 15, fontWeight: '700', color: '#1f2937' },
  badge: { marginTop: 4, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  badgePaid: { backgroundColor: '#dcfce7' },
  badgePartial: { backgroundColor: '#fef9c3' },
  badgePending: { backgroundColor: '#fee2e2' },
  badgeTxt: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 60, fontSize: 14 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#1f2937' },
  modalSub: { fontSize: 13, color: '#6b7280', marginBottom: 8 },
  label: { fontSize: 13, color: '#374151', marginBottom: 4, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 10, fontSize: 15 },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 20 },
  btn: { flex: 1, padding: 14, borderRadius: 10, alignItems: 'center' },
  btnCancel: { backgroundColor: '#e5e7eb' },
  btnCancelTxt: { color: '#374151', fontWeight: '600' },
  btnPaid: { backgroundColor: '#22c55e' },
  btnPaidTxt: { color: '#fff', fontWeight: '700' },
  btnUnpaid: { backgroundColor: '#fee2e2' },
  btnUnpaidTxt: { color: '#ef4444', fontWeight: '700' },
});
