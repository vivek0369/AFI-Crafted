import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

export type MeasureUnit = 'CBM' | 'CFT';
export type CalcType = 'round-log' | 'round-log-cbm' | 'cut-size' | 'plywood';
export type InputSystem = 'm-cm' | 'cm-cm' | 'ft-in';

export interface CalcEntry {
  id: string;
  name: string;
  length: number;
  inputSystem: InputSystem; // Added inputSystem to track how it was measured
  girth?: number;
  width?: number;
  thickness?: number;
  nos: number;
  rate: number;
  allowance?: number;
  unit: MeasureUnit;
  volume: number;
  value: number;
}

export interface SavedReport {
  id: string;
  title: string;
  client: string;
  calcType: CalcType;
  entries: CalcEntry[];
  totalVolume: number;
  totalValue: number;
  unit: MeasureUnit;
  date: string;
  status: 'Draft' | 'Final';
  discount?: number; // Added for fuller functionality
  tax?: number;      // Added for fuller functionality
}

export interface Party {
  id: string;
  name: string;
  phone?: string;
  address?: string;
}

const REPORTS_KEY = 'afi_reports';
const PARTIES_KEY = 'afi_parties';
const UNIT_KEY = 'afi_unit';
const THEME_KEY = 'afi_theme';
const SETTINGS_KEY = 'afi_settings';

export interface AppSettings {
  companyName: string;
  reportTitle: string;
  showDefaultItem: boolean;
  enableAllowance: boolean;
  enableLogNumber: boolean;
  measureFormat: string;
  currencyDecimal: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  companyName: '',
  reportTitle: 'Estimate',
  showDefaultItem: true,
  enableAllowance: true, // Default to true for "Plus" functionality
  enableLogNumber: true,
  measureFormat: 'Wid x Thick x Len',
  currencyDecimal: '0.00',
};

export async function getSettings(): Promise<AppSettings> {
  const d = await AsyncStorage.getItem(SETTINGS_KEY);
  return d ? { ...DEFAULT_SETTINGS, ...JSON.parse(d) } : DEFAULT_SETTINGS;
}
export async function saveSettings(s: Partial<AppSettings>) {
  const current = await getSettings();
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...current, ...s }));
}

export async function getReports(): Promise<SavedReport[]> {
  const token = await AsyncStorage.getItem('afi_token');
  if (token) {
    try {
      const remote = await api.reports.list();
      // Normalize _id from MongoDB to id for the frontend
      const normalized = remote.map((r: any) => ({ ...r, id: r._id || r.id }));
      await AsyncStorage.setItem(REPORTS_KEY, JSON.stringify(normalized));
      return normalized;
    } catch (e) {
      console.log('Using local fallback for reports');
    }
  }
  const d = await AsyncStorage.getItem(REPORTS_KEY);
  return d ? JSON.parse(d) : [];
}
export async function saveReport(r: SavedReport) {
  const list = await getReports();
  const i = list.findIndex(x => x.id === r.id);
  if (i >= 0) list[i] = r; else list.unshift(r);
  await AsyncStorage.setItem(REPORTS_KEY, JSON.stringify(list));

  const token = await AsyncStorage.getItem('afi_token');
  if (token) {
    try {
      if (r.id.length > 20) { // MongoDB ID is usually longer than our local id
        await api.reports.update(r.id, r);
      } else {
        const result = await api.reports.create(r);
        // Update local with the new MongoDB ID
        const newList = list.map(x => x.id === r.id ? { ...x, id: result._id } : x);
        await AsyncStorage.setItem(REPORTS_KEY, JSON.stringify(newList));
      }
    } catch (e) {
      console.log('Failed to sync report to backend');
    }
  }
}
export async function deleteReport(id: string) {
  const list = await getReports();
  await AsyncStorage.setItem(REPORTS_KEY, JSON.stringify(list.filter(r => r.id !== id)));

  const token = await AsyncStorage.getItem('afi_token');
  if (token && id.length > 20) {
    try {
      await api.reports.delete(id);
    } catch (e) {
      console.log('Failed to delete report from backend');
    }
  }
}

export async function getParties(): Promise<Party[]> {
  const d = await AsyncStorage.getItem(PARTIES_KEY);
  return d ? JSON.parse(d) : [];
}
export async function saveParty(p: Party) {
  const list = await getParties();
  const i = list.findIndex(x => x.id === p.id);
  if (i >= 0) list[i] = p; else list.push(p);
  await AsyncStorage.setItem(PARTIES_KEY, JSON.stringify(list));
}
export async function deleteParty(id: string) {
  const list = await getParties();
  await AsyncStorage.setItem(PARTIES_KEY, JSON.stringify(list.filter(x => x.id !== id)));
}

export async function getUnit(): Promise<MeasureUnit> {
  return ((await AsyncStorage.getItem(UNIT_KEY)) as MeasureUnit) || 'CBM';
}
export async function setUnit(u: MeasureUnit) {
  await AsyncStorage.setItem(UNIT_KEY, u);
}
export async function getTheme(): Promise<'light' | 'dark'> {
  return ((await AsyncStorage.getItem(THEME_KEY)) as 'light' | 'dark') || 'dark';
}
export async function setTheme(t: 'light' | 'dark') {
  await AsyncStorage.setItem(THEME_KEY, t);
}

export function calcVolumeCBM(type: CalcType, e: Partial<CalcEntry>): number {
  const system = e.inputSystem || 'm-cm';
  let L = e.length || 0;
  let A = e.allowance || 0;

  // Convert Length to meters if needed
  if (system === 'cm-cm') L = L / 100;
  
  if (system === 'ft-in') {
    // Handle Imperial calculation (Ft x In)
    const L_ft = e.length || 0;
    const A_in = e.allowance || 0;

    if (type === 'round-log') {
      const G_adj = Math.max(0, (e.girth || 0) - A_in);
      const volCFT = ((G_adj / 4) * (G_adj / 4) * L_ft) / 144;
      return volCFT / 35.3147;
    }
    if (type === 'round-log-cbm') {
      const G_adj = Math.max(0, (e.girth || 0) - A_in);
      const r = G_adj / (2 * Math.PI);
      const volCFT = (Math.PI * r * r * L_ft) / 144;
      return volCFT / 35.3147;
    }
    const W_adj = Math.max(0, (e.width || 0) - A_in);
    const T_adj = e.thickness || 0;
    const volCFT = (L_ft * W_adj * T_adj * (e.nos || 1)) / 144;
    return volCFT / 35.3147;
  }

  // Handle Metric calculation (M x Cm or Cm x Cm)
  if (type === 'round-log') {
    const G_adj = Math.max(0, (e.girth || 0) - A) / 100;
    return (G_adj / 4) * (G_adj / 4) * L;
  }
  if (type === 'round-log-cbm') {
    const G_adj = Math.max(0, (e.girth || 0) - A) / 100;
    const r = G_adj / (2 * Math.PI);
    return Math.PI * r * r * L;
  }
  
  const W_adj = Math.max(0, (e.width || 0) - A) / 100;
  const T_adj = (e.thickness || 0) / 100;
  
  if (type === 'plywood') {
    return L * W_adj * (e.nos || 1);
  }

  return L * W_adj * T_adj * (e.nos || 1);
}
export function cbmToCft(v: number) { return v * 35.3147; }
export function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }
