import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../constants/ThemeContext';
import { getColors } from '../../constants/colors';

const BACKUP_DIR = (FileSystem.documentDirectory || '') + 'Backups/';
const BACKUP_FILE = BACKUP_DIR + 'afi_backup.json';

type ThemeColors = ReturnType<typeof getColors>;

function makeStyles(C: ThemeColors) {

  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.bg },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingVertical: 14,
      backgroundColor: C.headerBg,
    },
    headerBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: C.headerText },
    body: { padding: 16, gap: 12 },
    sectionTitle: { fontSize: 20, fontWeight: '700', color: C.text, marginBottom: 4 },
    btn: {
      borderRadius: 8, paddingVertical: 14, paddingHorizontal: 12,
      alignItems: 'center', justifyContent: 'center',
    },
    btnText: { color: '#fff', fontWeight: '700', fontSize: 13, letterSpacing: 0.8, textAlign: 'center' },
    infoRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
    infoLabel: { fontSize: 12, color: C.textMuted, flex: 1 },
    infoValue: { fontSize: 12, color: C.textMuted, flex: 1.5 },
    restoreNote: { fontSize: 12, color: C.textMuted, marginBottom: 4 },
    statusText: { fontSize: 13, color: C.accentText, textAlign: 'center', marginTop: 8 },
  });
}

export default function BackupScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const C = getColors(isDark);
  const [status, setStatus] = useState('');

  const s = makeStyles(C);
  
  async function ensureDir() {
    const info = await FileSystem.getInfoAsync(BACKUP_DIR);
    if (!info.exists) await FileSystem.makeDirectoryAsync(BACKUP_DIR, { intermediates: true });
  }

  async function backupToLocal() {
    try {
      await ensureDir();
      const keys = await AsyncStorage.getAllKeys();
      const pairs = await AsyncStorage.multiGet(keys);
      const data: Record<string, string> = {};
      pairs.forEach(([k, v]) => { if (v) data[k] = v; });
      await FileSystem.writeAsStringAsync(BACKUP_FILE, JSON.stringify(data));
      setStatus('Backup saved to local storage.');
      Alert.alert('Success', 'Backup saved locally.');
    } catch (e) {
      Alert.alert('Error', 'Backup failed.');
    }
  }

  async function backupAndSend() {
    try {
      await ensureDir();
      const keys = await AsyncStorage.getAllKeys();
      const pairs = await AsyncStorage.multiGet(keys);
      const data: Record<string, string> = {};
      pairs.forEach(([k, v]) => { if (v) data[k] = v; });
      const path = (FileSystem.cacheDirectory || '') + 'afi_backup.json';
      await FileSystem.writeAsStringAsync(path, JSON.stringify(data));
      await Sharing.shareAsync(path, { mimeType: 'application/json', dialogTitle: 'AFI Backup' });
    } catch (e) {
      Alert.alert('Error', 'Could not share backup.');
    }
  }

  async function restoreFromLocal() {
    try {
      const info = await FileSystem.getInfoAsync(BACKUP_FILE);
      if (!info.exists) {
        Alert.alert('Not Found', 'No local backup found. Please backup first.');
        return;
      }
      const content = await FileSystem.readAsStringAsync(BACKUP_FILE);
      const data: Record<string, string> = JSON.parse(content);
      const pairs: [string, string][] = Object.entries(data);
      await AsyncStorage.multiSet(pairs);
      Alert.alert('Success', 'Data restored from local backup.');
    } catch (e) {
      Alert.alert('Error', 'Restore failed.');
    }
  }

  async function restoreFromFile() {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
      if (result.canceled) return;
      const uri = result.assets[0].uri;
      const content = await FileSystem.readAsStringAsync(uri);
      const data: Record<string, string> = JSON.parse(content);
      const pairs: [string, string][] = Object.entries(data);
      await AsyncStorage.multiSet(pairs);
      Alert.alert('Success', 'Data restored from file.');
    } catch (e) {
      Alert.alert('Error', 'Restore failed. Make sure the file is a valid AFI backup.');
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={C.headerText} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Backup and Restore</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={s.body}>
        {/* Backup section */}
        <Text style={s.sectionTitle}>Backup Data</Text>

        <TouchableOpacity style={[s.btn, { backgroundColor: C.btnGreen }]} onPress={backupToLocal}>
          <Text style={s.btnText}>BACKUP TO LOCAL</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[s.btn, { backgroundColor: C.btnDark }]} onPress={backupAndSend}>
          <Text style={s.btnText}>BACKUP AND SEND FILE</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.btn, { backgroundColor: C.btnBlue }]}
          onPress={() => Alert.alert('Google Drive', 'Google Drive backup is not available in this version.')}
        >
          <Text style={s.btnText}>BACKUP TO GOOGLE DRIVE{'\n'}(RECOMMENDED)</Text>
        </TouchableOpacity>

        <View style={s.infoRow}>
          <Text style={s.infoLabel}>Local Backup and Restore Location :</Text>
          <Text style={s.infoValue}>{BACKUP_DIR}</Text>
        </View>

        {/* Restore section */}
        <Text style={[s.sectionTitle, { marginTop: 24 }]}>Restore Data</Text>
        <Text style={s.restoreNote}>
          For Restore Database From Local: Copy backup file to Application Backup Folder.
        </Text>

        <TouchableOpacity style={[s.btn, { backgroundColor: C.btnOrange }]} onPress={restoreFromLocal}>
          <Text style={s.btnText}>RESTORE FROM LOCAL</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[s.btn, { backgroundColor: C.btnTeal }]} onPress={restoreFromFile}>
          <Text style={s.btnText}>RESTORE FROM FILE</Text>
        </TouchableOpacity>

        {status ? <Text style={s.statusText}>{status}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

