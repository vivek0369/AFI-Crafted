import { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Modal, Share, Linking, Alert, StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../constants/ThemeContext';
import { getColors } from '../../constants/colors';
import { CalcType } from '../../constants/storage';

const CALCS: { type: CalcType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { type: 'round-log',     label: 'Round Log',                    icon: 'ellipse' },
  { type: 'round-log-cbm', label: 'Round Log (Cubic Metre)',      icon: 'reload-circle' },
  { type: 'cut-size',      label: 'Cut Size (Cubic Feet)',        icon: 'grid' },
  { type: 'plywood',       label: 'Plywood / Door (Square Feet)', icon: 'stop' },
];

const DRAWER_MAIN = [
  { icon: 'people-outline' as const, label: 'All Parties', route: '/parties', action: null },
  { icon: 'list-outline' as const,   label: 'All Items',   route: '/items',   action: null },
];

const DRAWER_OTHERS = [
  { icon: 'chatbubble-outline' as const,         label: 'Feedback',  route: null, action: 'FEEDBACK' },
  { icon: 'share-social-outline' as const,       label: 'Share App', route: null, action: 'SHARE' },
  { icon: 'information-circle-outline' as const, label: 'About',     route: null, action: 'ABOUT' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const C = getColors(isDark);
  const [drawerOpen, setDrawerOpen] = useState(false);

  async function handleDrawerAction(item: typeof DRAWER_OTHERS[0]) {
    setDrawerOpen(false);
    if (item.route) {
      setTimeout(() => router.push(item.route as any), 150);
      return;
    }

    if (item.action === 'SHARE') {
      try {
        await Share.share({
          message: 'Download Timber Calculator Plus - The smartest way to done all type of wood calculations: https://play.google.com/store/apps/details?id=com.ska.timbercalculator.plus',
        });
      } catch (e) {}
    } else if (item.action === 'FEEDBACK') {
      Linking.openURL('mailto:info@afi-crafted.com?subject=AFI - Crafted Feedback');
    } else if (item.action === 'ABOUT') {
      Alert.alert('About', 'AFI - Crafted\nVersion 1.0.0\nProfessional Timber Calculator for Merchants and Sawmills.');
    }
  }

  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Status Bar Spacer */}
      <View style={{ height: StatusBar.currentHeight, backgroundColor: C.headerBg }} />
      {/* Header */}
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingHorizontal: 16, 
        paddingVertical: 12, 
        backgroundColor: C.headerBg 
      }}>
        <TouchableOpacity onPress={() => setDrawerOpen(true)} style={{ padding: 4 }}>
          <Ionicons name="menu" size={24} color={C.headerText} />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '700', color: C.headerText }}>AFI - Crafted</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Calculator list */}
      <ScrollView contentContainerStyle={{ padding: 12, gap: 10 }}>
        {CALCS.map(c => (
          <TouchableOpacity
            key={c.type}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.card, borderRadius: 12, padding: 14, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 }}
            activeOpacity={0.7}
            onPress={() => router.push(`/calculator/${c.type}`)}
          >
            <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: C.greenLight, justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name={c.icon} size={28} color={C.accentText} />
            </View>
            <Text style={{ flex: 1, fontSize: 15, fontWeight: '500', color: C.text }}>{c.label}</Text>
            <Ionicons name="chevron-forward" size={20} color={C.textMuted} />
          </TouchableOpacity>
        ))}

        {/* Backup & Restore */}
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.card, borderRadius: 12, padding: 14, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 }}
          activeOpacity={0.7}
          onPress={() => router.push('/backup')}
        >
          <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: C.greenLight, justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="cloud-upload-outline" size={26} color={C.accentText} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '500', color: C.text }}>Backup and Restore</Text>
            <Text style={{ fontSize: 11, color: C.textMuted, marginTop: 1 }}>Please take Google Drive backup</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Drawer */}
      <Modal visible={drawerOpen} transparent animationType="fade">
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <View style={{ width: '70%', backgroundColor: C.card, elevation: 12, shadowColor: '#000', shadowOffset: { width: 2, height: 0 }, shadowOpacity: 0.25, shadowRadius: 10 }}>
            {/* Drawer header */}
            <View style={{ backgroundColor: C.headerBg, padding: 16, paddingTop: 40, gap: 2 }}>
              <View style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: C.greenLight, justifyContent: 'center', alignItems: 'center', marginBottom: 4 }}>
                <Ionicons name="leaf" size={22} color={C.accentText} />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '700', color: C.headerText }}>AFI - Crafted</Text>
              <Text style={{ fontSize: 11, color: isDark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.5)' }}>Timber Calculator</Text>
            </View>


            <ScrollView>
              <Text style={{ fontSize: 10, color: C.textMuted, fontWeight: '700', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4, textTransform: 'uppercase' }}>Main</Text>
              {DRAWER_MAIN.map(item => (
                <TouchableOpacity key={item.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.borderLight }} onPress={() => handleDrawerAction(item)}>
                  <Ionicons name={item.icon} size={18} color={C.text} />
                  <Text style={{ fontSize: 13, color: C.text, fontWeight: '500' }}>{item.label}</Text>
                </TouchableOpacity>
              ))}

              <View style={{ height: 1, backgroundColor: C.border, marginHorizontal: 16, marginTop: 4 }} />

              <Text style={{ fontSize: 10, color: C.textMuted, fontWeight: '700', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4, textTransform: 'uppercase' }}>Others</Text>
              {DRAWER_OTHERS.map(item => (
                <TouchableOpacity key={item.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.borderLight }} onPress={() => handleDrawerAction(item)}>
                  <Ionicons name={item.icon} size={18} color={C.text} />
                  <Text style={{ fontSize: 13, color: C.text, fontWeight: '500' }}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Tap outside to close */}
          <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} onPress={() => setDrawerOpen(false)} />
        </View>
      </Modal>
    </View>
  );
}

