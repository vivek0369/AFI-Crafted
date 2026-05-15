import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, Modal, StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../constants/ThemeContext';
import { getColors } from '../constants/colors';
import { Party, getParties, saveParty, deleteParty, genId } from '../constants/storage';

export default function PartiesScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const C = getColors(isDark);
  const [parties, setParties] = useState<Party[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingParty, setEditingParty] = useState<Party | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    loadParties();
  }, []);

  async function loadParties() {
    const list = await getParties();
    setParties(list);
  }

  function openAddModal(p?: Party) {
    if (p) {
      setEditingParty(p);
      setName(p.name);
      setPhone(p.phone || '');
      setAddress(p.address || '');
    } else {
      setEditingParty(null);
      setName('');
      setPhone('');
      setAddress('');
    }
    setShowAddModal(true);
  }

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('Required', 'Name is required.');
      return;
    }
    const party: Party = {
      id: editingParty?.id || genId(),
      name,
      phone,
      address,
    };
    await saveParty(party);
    setShowAddModal(false);
    loadParties();
  }

  function handleDelete(id: string) {
    Alert.alert('Delete Party', 'Are you sure you want to delete this party?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await deleteParty(id);
        loadParties();
      }},
    ]);
  }

  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: C.bg }]}>
      {/* Status Bar Spacer */}
      <View style={{ height: StatusBar.currentHeight, backgroundColor: C.headerBg }} />
      {/* Header */}
      <View style={[styles.header, { backgroundColor: C.headerBg, paddingTop: 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={C.headerText} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: C.headerText }]}>All Parties</Text>
        <TouchableOpacity onPress={() => openAddModal()} style={styles.headerBtn}>
          <Ionicons name="add" size={24} color={C.headerText} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {parties.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={64} color={C.textMuted} />
            <Text style={[styles.emptyText, { color: C.textMuted }]}>No parties saved yet.</Text>
            <TouchableOpacity style={[styles.addBtnInline, { backgroundColor: C.btnGreen }]} onPress={() => openAddModal()}>
              <Text style={styles.addBtnText}>ADD NEW PARTY</Text>
            </TouchableOpacity>
          </View>
        ) : (
          parties.map(p => (
            <TouchableOpacity 
              key={p.id} 
              style={[styles.card, { backgroundColor: C.card, borderColor: C.border }]}
              onPress={() => openAddModal(p)}
              onLongPress={() => handleDelete(p.id)}
            >
              <View style={[styles.avatar, { backgroundColor: C.greenLight }]}>
                <Text style={[styles.avatarText, { color: C.accentText }]}>{p.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.cardContent}>
                <Text style={[styles.name, { color: C.text }]}>{p.name}</Text>
                {p.phone && <Text style={[styles.phone, { color: C.textSub }]}>{p.phone}</Text>}
                {p.address && <Text style={[styles.address, { color: C.textMuted }]} numberOfLines={1}>{p.address}</Text>}
              </View>
              <Ionicons name="chevron-forward" size={20} color={C.border} />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.overlayBg} onPress={() => setShowAddModal(false)} />
          <View style={[styles.sheet, { backgroundColor: C.card }]}>
            <View style={[styles.sheetHandle, { backgroundColor: C.border }]} />
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: C.text }]}>{editingParty ? 'Edit Party' : 'Add New Party'}</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={C.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: C.textMuted }]}>Name *</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: C.inputBg, borderColor: C.border, color: C.text }]} 
                value={name} 
                onChangeText={setName}
                placeholder="Client name"
                placeholderTextColor={C.textMuted}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: C.textMuted }]}>Phone Number</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: C.inputBg, borderColor: C.border, color: C.text }]} 
                value={phone} 
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="+91 00000 00000"
                placeholderTextColor={C.textMuted}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: C.textMuted }]}>Address</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: C.inputBg, borderColor: C.border, color: C.text, height: 80 }]} 
                value={address} 
                onChangeText={setAddress}
                multiline
                placeholder="Client address"
                placeholderTextColor={C.textMuted}
              />
            </View>

            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: C.btnGreen }]} onPress={handleSave}>
              <Text style={styles.saveBtnText}>SAVE PARTY</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 2,
  },
  headerBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  list: { padding: 16, gap: 12 },
  card: {
    flexDirection: 'row', alignItems: 'center',
    padding: 12, borderRadius: 12, borderWidth: 1,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 14,
  },
  avatarText: { fontSize: 20, fontWeight: '700' },
  cardContent: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  phone: { fontSize: 14, marginBottom: 1 },
  address: { fontSize: 12 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100, gap: 16 },
  emptyText: { fontSize: 16, fontWeight: '500' },
  addBtnInline: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  overlayBg: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40, gap: 20,
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 8 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sheetTitle: { fontSize: 20, fontWeight: '700' },
  field: { gap: 8 },
  label: { fontSize: 14, fontWeight: '500' },
  input: {
    borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 16,
  },
  saveBtn: {
    paddingVertical: 16, borderRadius: 12, alignItems: 'center',
    marginTop: 8,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
