import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, TextInput, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTheme } from '../../constants/ThemeContext';
import { getColors } from '../../constants/colors';
import { SavedReport, getReports, deleteReport } from '../../constants/storage';
import { generateLocalPDF } from '../../constants/pdfGenerator';

export default function SavedScreen() {
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { isDark } = useTheme();
  const C = getColors(isDark);

  useFocusEffect(useCallback(() => { load(); }, []));
  async function load() { setReports(await getReports()); }

  async function handleDelete(id: string) {
    Alert.alert('Delete', 'Delete this report?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          // Update UI immediately so report disappears right away
          setReports(prev => prev.filter(r => r.id !== id));
          try {
            await deleteReport(id);
          } catch (e: any) {
            Alert.alert('Error', 'Failed to delete report: ' + e.message);
            load(); // Reload to restore correct state on failure
          }
        }
      },
    ]);
  }

  async function handleShare(r: SavedReport) {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Not Available', 'Sharing is not available on this device.');
        return;
      }

      const lines = [
        `*AFI - Crafted Report*`,
        `Title: ${r.title}`,
        `Client: ${r.client}`,
        `Date: ${new Date(r.date).toLocaleDateString()}`,
        `Unit: ${r.unit}`,
        `--------------------------`,
        ...r.entries.map((e, i) => {
          let entryText = `${i + 1}. ${e.name}: ${e.length}m x ${e.girth || e.width}cm`;
          if (e.allowance && e.allowance > 0) entryText += ` (A:${e.allowance})`;
          entryText += ` = ${(e.volume ?? 0).toFixed(3)} ${r.unit}`;
          return entryText;
        }),
        `--------------------------`,
        `Total Volume: ${(r.totalVolume || 0).toFixed(3)} ${r.unit}`,
        `Subtotal: $${(r.totalValue || 0).toFixed(2)}`,
      ];

      if (r.discount && r.discount > 0) {
        lines.push(`Discount: ${r.discount}% (-$${(r.totalValue * r.discount / 100).toFixed(2)})`);
      }
      if (r.tax && r.tax > 0) {
        lines.push(`Tax: ${r.tax}% (+$${(r.totalValue * r.tax / 100).toFixed(2)})`);
      }

      const finalTotal = r.totalValue * (1 - (r.discount || 0) / 100) * (1 + (r.tax || 0) / 100);
      lines.push(`*Grand Total: $${finalTotal.toFixed(2)}*`);

      const path = FileSystem.cacheDirectory + `report_${r.id}.txt`;
      await FileSystem.writeAsStringAsync(path, lines.join('\n'));
      await Sharing.shareAsync(path, { mimeType: 'text/plain', dialogTitle: r.title });
    } catch (e: any) {
      Alert.alert('Error', 'Failed to share report: ' + e.message);
    }
  }

  async function handlePDFShare(r: SavedReport) {
    if (loading) return;
    setLoading(true);
    try {
      await generateLocalPDF(r);
    } catch (e: any) {
      Alert.alert('Error', 'Failed to generate PDF: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  const filtered = reports.filter(r =>
    (r.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.client || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.id || '').includes(search)
  );
  const visible = showAll ? filtered : filtered.slice(0, 4);

  const s = makeStyles(C);

  return (
    <View style={s.safe}>
      {/* Status Bar Spacer */}
      <View style={{ height: StatusBar.currentHeight || 0, backgroundColor: C.headerBg }} />
      <View style={[s.header, { paddingTop: 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color={C.headerText} />
        </TouchableOpacity>
        <Text style={s.brand}>Saved Reports</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={s.body}>
        <Text style={s.title}>Saved Reports</Text>
        <Text style={s.sub}>Access your historical timber calculations and client estimates.</Text>

        <View style={s.searchBox}>
          <Ionicons name="search-outline" size={16} color={C.textMuted} />
          <TextInput
            style={s.searchInput}
            placeholder="Search by client, project title, or ID..."
            placeholderTextColor={C.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {visible.length === 0 && (
          <Text style={s.empty}>No saved reports yet.</Text>
        )}

        {visible.map((r, idx) => (
          <View key={r.id || `temp-${idx}`} style={s.card}>
            <View style={s.cardIcon}>
              <Ionicons
                name={r.status === 'Draft' ? 'document-outline' : 'document-text-outline'}
                size={20} color={C.accentText}
              />
            </View>
            <View style={s.cardBody}>
              <View style={s.cardTop}>
                <Text style={s.cardTitle} numberOfLines={1}>{r.title}</Text>
                <View style={[s.badge, r.status === 'Draft' ? s.badgePending : s.badgeValue]}>
                  <Text style={[s.badgeText, r.status !== 'Draft' && { color: C.accentText }]}>
                    {r.status === 'Draft' ? 'Pending' : `$${(r.totalValue || 0).toFixed(2)}`}
                  </Text>
                </View>
              </View>
              <Text style={s.cardDate}>
                {new Date(r.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                {' • Est. #'}{r.id.slice(-4).toUpperCase()}
              </Text>
              <Text style={s.cardVol}>
                {'TOTAL VOL.  '}
                <Text style={s.cardVolNum}>{(r.totalVolume || 0).toFixed(3)}</Text>
                {'  '}{r.unit}
              </Text>
            </View>
            <View style={s.actions}>
              <TouchableOpacity
                onPress={() => handlePDFShare(r)}
                style={s.actionBtn}
                disabled={loading}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="document-outline" size={20} color={loading ? C.textMuted : C.accentText} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleShare(r)}
                style={s.actionBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="share-social-outline" size={20} color={C.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDelete(r.id)}
                style={s.actionBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="trash-outline" size={20} color={C.danger} />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {filtered.length > 4 && (
          <TouchableOpacity style={s.loadMore} onPress={() => setShowAll(v => !v)}>
            <Ionicons name={showAll ? 'chevron-up' : 'chevron-down'} size={15} color={C.textMuted} />
            <Text style={s.loadMoreText}>{showAll ? 'Show Less' : 'Load Older Reports'}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

function makeStyles(C: ReturnType<typeof getColors>) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.bg },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 18, paddingVertical: 14,
      backgroundColor: C.headerBg,
    },
    brand: { fontSize: 17, fontWeight: '700', color: C.headerText },
    body: { padding: 16, gap: 12 },
    title: { fontSize: 24, fontWeight: '700', color: C.text },
    sub: { fontSize: 13, color: C.textSub, marginTop: -4 },
    searchBox: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: C.card, borderRadius: 10,
      paddingHorizontal: 12, paddingVertical: 10,
      borderWidth: 1, borderColor: C.border,
    },
    searchInput: { flex: 1, color: C.text, fontSize: 13 },
    empty: { color: C.textMuted, textAlign: 'center', marginTop: 40 },
    card: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: C.card, borderRadius: 12, padding: 14,
      borderWidth: 1, borderColor: C.border,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
    },
    cardIcon: {
      width: 40, height: 40, borderRadius: 9,
      backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center',
      borderWidth: 1, borderColor: C.border,
    },
    cardBody: { flex: 1, gap: 3 },
    cardTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    cardTitle: { flex: 1, fontSize: 13, fontWeight: '600', color: C.text },
    cardDate: { fontSize: 11, color: C.textMuted },
    cardVol: { fontSize: 11, color: C.textMuted },
    cardVolNum: { fontWeight: '700', color: C.textSub },
    badge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
    badgeValue: { backgroundColor: C.greenLight },
    badgePending: { backgroundColor: '#fff3e0' },
    badgeText: { fontSize: 11, fontWeight: '700', color: '#e65100' },
    actions: { gap: 10 },
    actionBtn: { padding: 4 },
    loadMore: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 6, paddingVertical: 12,
      borderWidth: 1, borderColor: C.border, borderRadius: 10,
      backgroundColor: C.card,
    },
    loadMoreText: { fontSize: 13, color: C.textSub },
  });
}
