import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Switch, Alert, Linking, StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme, ThemeMode } from '../../constants/ThemeContext';
import { getColors } from '../../constants/colors';
import {
  getUnit, setUnit, MeasureUnit,
  getSettings, saveSettings, AppSettings,
} from '../../constants/storage';
import { api } from '../../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

type RowItem =
  | { kind: 'nav';    label: string; sub?: string; onPress: () => void }
  | { kind: 'toggle'; label: string; sub?: string; key: keyof AppSettings };

export default function SettingsScreen() {
  const router = useRouter();
  const { mode: themeMode, setMode: setThemeMode, isDark } = useTheme();
  const C = getColors(isDark);

  const [unit, setUnitState] = useState<MeasureUnit>('CBM');
  const [settings, setSettings] = useState<AppSettings>({
    companyName: '', reportTitle: 'Estimate',
    showDefaultItem: true, enableAllowance: false,
    enableLogNumber: false, measureFormat: 'Wid x Thick x Len',
    currencyDecimal: '0.00',
  });
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getUnit().then(setUnitState);
    getSettings().then(setSettings);
    checkUser();
  }, []);

  async function checkUser() {
    const userData = await AsyncStorage.getItem('afi_user');
    if (userData) setUser(JSON.parse(userData));
  }

  async function handleLogout() {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => {
        await AsyncStorage.removeItem('afi_token');
        await AsyncStorage.removeItem('afi_user');
        setUser(null);
        router.replace('/auth/login');
      }},
    ]);
  }

  async function toggle(key: keyof AppSettings) {
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    await saveSettings({ [key]: next[key] });
  }

  const SECTIONS: { title: string; rows: RowItem[] }[] = [
    {
      title: '',
      rows: [
        { kind: 'nav', label: 'Subscribe Premium', sub: 'Premium features, Remove Ads, ...', onPress: () => Alert.alert('Premium', 'Coming soon!') },
      ],
    },
    {
      title: 'GENERAL SETTINGS',
      rows: [
        { kind: 'nav', label: 'Company Information', onPress: () => Alert.alert('Company', 'Set your company name.') },
        { kind: 'nav', label: 'Report Title', sub: settings.reportTitle, onPress: () => Alert.alert('Report Title', 'Change the default report title.') },
        { kind: 'nav', label: 'Measurement Unit', sub: unit, onPress: () => Alert.alert('Unit', 'Select unit', [
          { text: 'CBM', onPress: async () => { await setUnit('CBM'); setUnitState('CBM'); } },
          { text: 'CFT', onPress: async () => { await setUnit('CFT'); setUnitState('CFT'); } },
          { text: 'Cancel', style: 'cancel' },
        ]) },
        { kind: 'nav', label: 'Backend Sync', sub: user ? `Logged in as ${user.name}` : 'Not Signed in', onPress: () => !user && router.push('/auth/login') },
      ],
    },
    {
      title: 'ACCOUNT',
      rows: user ? [
        { kind: 'nav', label: 'My Profile', sub: user.email, onPress: () => {} },
        { kind: 'nav', label: 'Logout', onPress: handleLogout },
      ] : [
        { kind: 'nav', label: 'Sign In / Sign Up', sub: 'Sync your data to the cloud', onPress: () => router.push('/auth/login') },
      ],
    },
    {
      title: 'ENTRY SETTINGS',
      rows: [
        { kind: 'nav', label: 'Currency Decimal Format', sub: settings.currencyDecimal, onPress: () => Alert.alert('Currency', 'Change decimal format.') },
        { kind: 'nav', label: 'Quantity Decimal Formats', sub: 'Click here to change qty decimal formats', onPress: () => Alert.alert('Qty Decimal', 'Change quantity decimal format.') },
        { kind: 'toggle', label: 'Show Default Item on entry startup', key: 'showDefaultItem' },
        { kind: 'toggle', label: 'Enable Allowance (Round Log)', key: 'enableAllowance' },
        { kind: 'toggle', label: 'Enable Log Number (Round Log)', key: 'enableLogNumber' },
        { kind: 'nav', label: 'Measurement Format (Cut Size)', sub: settings.measureFormat, onPress: () => Alert.alert('Format', 'Change measurement format.') },
      ],
    },
    {
      title: 'LOVE THIS APP?',
      rows: [
        { kind: 'nav', label: 'Rate This App', onPress: () => Alert.alert('Rate', 'Thank you!') },
        { kind: 'nav', label: 'Share this app', onPress: () => Alert.alert('Share', 'Share AFI - Crafted.') },
        { kind: 'nav', label: 'Facebook', onPress: () => Linking.openURL('https://facebook.com') },
      ],
    },
    {
      title: 'HELP AND SUPPORT',
      rows: [
        { kind: 'nav', label: 'Help', onPress: () => Alert.alert('Help', 'Contact us for help.') },
        { kind: 'nav', label: 'Mail to Us', onPress: () => Linking.openURL('mailto:support@afi.com') },
        { kind: 'nav', label: 'WhatsApp Chat', onPress: () => Linking.openURL('https://wa.me/') },
      ],
    },
    {
      title: 'ABOUT',
      rows: [
        { kind: 'nav', label: 'Terms and Conditions', onPress: () => Alert.alert('Terms', 'Terms and conditions apply.') },
        { kind: 'nav', label: 'About', onPress: () => Alert.alert('About', 'AFI - Crafted v1.0.0') },
      ],
    },
  ];

  const THEMES: { mode: ThemeMode; icon: 'sunny' | 'moon' | 'phone-portrait-outline'; label: string }[] = [
    { mode: 'light',  icon: 'sunny',                  label: 'Light' },
    { mode: 'dark',   icon: 'moon',                   label: 'Dark' },
    { mode: 'system', icon: 'phone-portrait-outline',  label: 'Application' },
  ];

  const s = makeStyles(C);

  const insets = useSafeAreaInsets();

  return (
    <View style={s.safe}>
      {/* Status Bar Spacer */}
      <View style={{ height: StatusBar.currentHeight, backgroundColor: C.headerBg }} />
      <View style={[s.header, { paddingTop: 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.headerBtn}>
          <Ionicons name="arrow-back" size={22} color={C.headerText} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Settings</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView>
        {/* THEME */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>THEME</Text>
        </View>
        <View style={s.themeRow}>
          {THEMES.map(t => (
            <TouchableOpacity
              key={t.mode}
              style={[s.themeBtn, themeMode === t.mode && { backgroundColor: C.greenLight, borderColor: C.accentText }]}
              onPress={() => setThemeMode(t.mode)}
            >
              <Ionicons name={t.icon} size={18} color={themeMode === t.mode ? C.accentText : C.textMuted} />
              <Text style={[s.themeBtnText, themeMode === t.mode && { color: C.accentText }]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* OTHER SECTIONS */}
        {SECTIONS.map((sec, si) => (
          <View key={si}>
            {sec.title ? (
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>{sec.title}</Text>
              </View>
            ) : null}
            {sec.rows.map((row, ri) => (
              <View key={ri}>
                {row.kind === 'nav' && (
                  <TouchableOpacity style={s.row} onPress={row.onPress}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.rowLabel}>{row.label}</Text>
                      {row.sub ? <Text style={s.rowSub}>{row.sub}</Text> : null}
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
                  </TouchableOpacity>
                )}
                {row.kind === 'toggle' && (
                  <View style={s.row}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.rowLabel}>{row.label}</Text>
                      {row.sub ? <Text style={s.rowSub}>{row.sub}</Text> : null}
                    </View>
                    <Switch
                      value={!!settings[row.key]}
                      onValueChange={() => toggle(row.key)}
                      trackColor={{ false: '#ccc', true: '#f4511e' }}
                      thumbColor="#fff"
                    />
                  </View>
                )}
                {ri < sec.rows.length - 1 && <View style={s.divider} />}
              </View>
            ))}
          </View>
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function makeStyles(C: ReturnType<typeof getColors>) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.card },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 14, paddingVertical: 12, backgroundColor: C.headerBg,
    },
    headerBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: C.headerText },
    sectionHeader: { backgroundColor: C.sectionHeader, paddingHorizontal: 14, paddingVertical: 8 },
    sectionTitle: { fontSize: 12, fontWeight: '700', color: C.text, letterSpacing: 0.3 },
    row: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 14, paddingVertical: 12, backgroundColor: C.card,
    },
    rowLabel: { fontSize: 14, color: C.text },
    rowSub: { fontSize: 11, color: C.textMuted, marginTop: 1 },
    divider: { height: 1, backgroundColor: C.borderLight, marginHorizontal: 14 },
    themeRow: {
      flexDirection: 'row', gap: 6,
      paddingHorizontal: 14, paddingVertical: 10, backgroundColor: C.card,
    },
    themeBtn: {
      flex: 1, alignItems: 'center', justifyContent: 'center',
      paddingVertical: 8, borderRadius: 6, gap: 3,
      borderWidth: 1.5, borderColor: C.border, backgroundColor: C.card,
    },
    themeBtnText: { fontSize: 10, fontWeight: '600', color: C.textMuted },
  });
}
