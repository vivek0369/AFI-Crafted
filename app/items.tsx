import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../constants/ThemeContext';
import { getColors } from '../constants/colors';
import { SavedReport, getReports, CalcEntry } from '../constants/storage';

interface FlatItem extends CalcEntry {
  reportTitle: string;
  date: string;
}

export default function AllItemsScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const C = getColors(isDark);
  const [items, setItems] = useState<FlatItem[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    const reports = await getReports();
    const flat: FlatItem[] = [];
    reports.forEach(r => {
      r.entries.forEach(e => {
        flat.push({
          ...e,
          reportTitle: r.title,
          date: r.date,
        });
      });
    });
    // Sort by date newest first
    flat.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setItems(flat);
  }

  const filtered = items.filter(i => 
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.reportTitle.toLowerCase().includes(search.toLowerCase())
  );

  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: C.bg }]}>
      {/* Status Bar Spacer */}
      <View style={{ height: StatusBar.currentHeight, backgroundColor: C.headerBg }} />
      <View style={[styles.header, { backgroundColor: C.headerBg, paddingTop: 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={C.headerText} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: C.headerText }]}>All Items</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.searchBar}>
        <View style={[styles.searchBox, { backgroundColor: C.card, borderColor: C.border }]}>
          <Ionicons name="search" size={20} color={C.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: C.text }]}
            placeholder="Search items or reports..."
            placeholderTextColor={C.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="list-outline" size={64} color={C.textMuted} />
            <Text style={[styles.emptyText, { color: C.textMuted }]}>No items found.</Text>
          </View>
        ) : (
          filtered.map((item, idx) => (
            <View key={item.id + idx} style={[styles.card, { backgroundColor: C.card, borderColor: C.border }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.itemName, { color: C.text }]}>{item.name}</Text>
                <Text style={[styles.itemDate, { color: C.textMuted }]}>
                  {new Date(item.date).toLocaleDateString()}
                </Text>
              </View>
              <Text style={[styles.reportRef, { color: C.accentText }]}>Ref: {item.reportTitle}</Text>
              <View style={styles.detailsRow}>
                <View style={styles.detail}>
                  <Text style={[styles.detailLabel, { color: C.textMuted }]}>Length</Text>
                  <Text style={[styles.detailVal, { color: C.text }]}>{item.length}m</Text>
                </View>
                <View style={styles.detail}>
                  <Text style={[styles.detailLabel, { color: C.textMuted }]}>Volume</Text>
                  <Text style={[styles.detailVal, { color: C.text }]}>{item.volume.toFixed(3)} {item.unit}</Text>
                </View>
                <View style={styles.detail}>
                  <Text style={[styles.detailLabel, { color: C.textMuted }]}>Value</Text>
                  <Text style={[styles.detailVal, { color: C.accentText }]}>${item.value.toFixed(2)}</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  headerBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  searchBar: { padding: 16, paddingTop: 8 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: 12, borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 15 },
  list: { padding: 16, paddingTop: 0, gap: 12 },
  card: {
    padding: 14, borderRadius: 12, borderWidth: 1,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  itemName: { fontSize: 16, fontWeight: '700' },
  itemDate: { fontSize: 12 },
  reportRef: { fontSize: 12, fontWeight: '600', marginBottom: 10 },
  detailsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  detail: { gap: 2 },
  detailLabel: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  detailVal: { fontSize: 14, fontWeight: '600' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100, gap: 16 },
  emptyText: { fontSize: 16, fontWeight: '500' },
});
