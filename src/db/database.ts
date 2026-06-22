import * as SQLite from 'expo-sqlite';
import { Tenant, RentRecord, TenantDocument } from '../types';

const db = SQLite.openDatabaseSync('renteasy.db');

export function initDB() {
  db.execSync(
    `CREATE TABLE IF NOT EXISTS tenants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      building TEXT DEFAULT '',
      room TEXT NOT NULL,
      monthly_rent REAL NOT NULL,
      move_in_date TEXT NOT NULL,
      contract_months INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )`
  );
  try { db.execSync(`ALTER TABLE tenants ADD COLUMN building TEXT DEFAULT ''`); } catch {}
  try { db.execSync(`ALTER TABLE tenants ADD COLUMN contract_months INTEGER DEFAULT 0`); } catch {}
  try { db.execSync(`ALTER TABLE tenants ADD COLUMN vacated_at TEXT`); } catch {}
  db.execSync(
    `CREATE TABLE IF NOT EXISTS tenant_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      uri TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    )`
  );
  db.execSync(
    `CREATE TABLE IF NOT EXISTS rent_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      month INTEGER NOT NULL,
      year INTEGER NOT NULL,
      amount_due REAL NOT NULL,
      amount_paid REAL DEFAULT 0,
      status TEXT DEFAULT 'pending',
      paid_at TEXT,
      notes TEXT,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
      UNIQUE(tenant_id, month, year)
    )`
  );
}

export function getTenants(): Tenant[] {
  return db.getAllSync<Tenant>('SELECT * FROM tenants ORDER BY building ASC, room ASC');
}

export function getTenant(id: number): Tenant | null {
  return db.getFirstSync<Tenant>('SELECT * FROM tenants WHERE id = ?', [id]);
}

export function addTenant(t: Omit<Tenant, 'id' | 'created_at'>): number {
  const result = db.runSync(
    'INSERT INTO tenants (name, phone, building, room, monthly_rent, move_in_date, contract_months) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [t.name, t.phone, t.building, t.room, t.monthly_rent, t.move_in_date, t.contract_months]
  );
  return result.lastInsertRowId;
}

export function updateTenant(id: number, t: Omit<Tenant, 'id' | 'created_at'>) {
  db.runSync(
    'UPDATE tenants SET name=?, phone=?, building=?, room=?, monthly_rent=?, move_in_date=?, contract_months=? WHERE id=?',
    [t.name, t.phone, t.building, t.room, t.monthly_rent, t.move_in_date, t.contract_months, id]
  );
}

export function deleteTenant(id: number) {
  db.runSync('DELETE FROM tenants WHERE id = ?', [id]);
}

export function getDocuments(tenantId: number): TenantDocument[] {
  return db.getAllSync<TenantDocument>(
    'SELECT * FROM tenant_documents WHERE tenant_id = ? ORDER BY created_at DESC',
    [tenantId]
  );
}

export function addDocument(doc: Omit<TenantDocument, 'id' | 'created_at'>): number {
  const result = db.runSync(
    'INSERT INTO tenant_documents (tenant_id, type, uri, name) VALUES (?, ?, ?, ?)',
    [doc.tenant_id, doc.type, doc.uri, doc.name]
  );
  return result.lastInsertRowId;
}

export function deleteDocument(id: number) {
  db.runSync('DELETE FROM tenant_documents WHERE id = ?', [id]);
}

export function getRentRecordsForMonth(month: number, year: number): RentRecord[] {
  return db.getAllSync<RentRecord>(`
    SELECT r.*, t.name as tenant_name, t.room, t.move_in_date
    FROM rent_records r
    JOIN tenants t ON r.tenant_id = t.id
    WHERE r.month = ? AND r.year = ?
    ORDER BY t.building ASC, t.room ASC
  `, [month, year]);
}

export function getRentRecordsForTenant(tenantId: number): RentRecord[] {
  return db.getAllSync<RentRecord>(
    'SELECT * FROM rent_records WHERE tenant_id = ? ORDER BY year DESC, month DESC',
    [tenantId]
  );
}

export function ensureRentRecordsForMonth(month: number, year: number) {
  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth() + 1;

  const tenants = getTenants();
  for (const t of tenants) {
    const [miYear, miMonth] = t.move_in_date.split('-').map(Number);

    // Skip months before move-in
    if (year < miYear || (year === miYear && month < miMonth)) continue;

    // Skip months from vacate month onwards
    if (t.vacated_at) {
      const [vacYear, vacMonth] = t.vacated_at.split('-').map(Number);
      if (year > vacYear || (year === vacYear && month >= vacMonth)) continue;
    }

    if (t.contract_months > 0) {
      // Contract tenant: generate records for all months within contract, including future ones
      const start = new Date(t.move_in_date);
      const end = new Date(start);
      end.setMonth(end.getMonth() + t.contract_months);
      const endYear = end.getFullYear();
      const endMonth = end.getMonth() + 1;
      if (year > endYear || (year === endYear && month >= endMonth)) continue;
    } else {
      // No contract: never generate future months
      if (year > curYear || (year === curYear && month > curMonth)) continue;
    }

    db.runSync(
      `INSERT OR IGNORE INTO rent_records (tenant_id, month, year, amount_due, amount_paid, status)
       VALUES (?, ?, ?, ?, 0, 'pending')`,
      [t.id, month, year, t.monthly_rent]
    );
  }
}

export function vacateTenant(id: number, vacatedAt: string) {
  db.runSync('UPDATE tenants SET vacated_at = ? WHERE id = ?', [vacatedAt, id]);
}

export function unvacateTenant(id: number) {
  db.runSync('UPDATE tenants SET vacated_at = NULL WHERE id = ?', [id]);
}

export function markRentPaid(recordId: number, amountPaid: number, notes?: string) {
  const record = db.getFirstSync<RentRecord>('SELECT * FROM rent_records WHERE id = ?', [recordId]);
  if (!record) return;
  const status = amountPaid >= record.amount_due ? 'paid' : amountPaid > 0 ? 'partial' : 'pending';
  db.runSync(
    `UPDATE rent_records SET amount_paid=?, status=?, paid_at=datetime('now'), notes=? WHERE id=?`,
    [amountPaid, status, notes ?? null, recordId]
  );
}

export function getDashboardStats(month: number, year: number) {
  ensureRentRecordsForMonth(month, year);
  const records = getRentRecordsForMonth(month, year);
  const totalDue = records.reduce((s, r) => s + r.amount_due, 0);
  const totalPaid = records.reduce((s, r) => s + r.amount_paid, 0);
  const pendingCount = records.filter(r => r.status !== 'paid').length;
  const paidCount = records.filter(r => r.status === 'paid').length;
  return { totalDue, totalPaid, pendingCount, paidCount, records };
}

// Returns days until contract expires (negative = already expired, 0 = no contract set)
export function contractStatus(tenant: Tenant): { daysLeft: number; endDate: string } | null {
  if (!tenant.contract_months || tenant.contract_months <= 0) return null;
  const start = new Date(tenant.move_in_date);
  const end = new Date(start);
  end.setMonth(end.getMonth() + tenant.contract_months);
  const daysLeft = Math.ceil((end.getTime() - Date.now()) / 86400000);
  return { daysLeft, endDate: end.toISOString().split('T')[0] };
}
