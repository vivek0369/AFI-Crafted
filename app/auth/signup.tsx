import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, KeyboardAvoidingView,
  Platform, Alert, ActivityIndicator, Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../constants/ThemeContext';
import { getColors } from '../../constants/colors';
import { api } from '../../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { isDark } = useTheme();
  const C = getColors(isDark);

  async function handleSignup() {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const data = await api.auth.signup({ name, email, password });
      await AsyncStorage.setItem('afi_token', data.token);
      await AsyncStorage.setItem('afi_user', JSON.stringify(data.user));
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Signup Failed', err.message);
    } finally {
      setLoading(false);
    }
  }

  const s = makeStyles(C);

  return (
    <SafeAreaView style={s.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={s.content}
      >
        <View style={s.header}>
          <Image 
            source={require('../../assets/logo.png')} 
            style={s.logo}
            resizeMode="contain"
          />
          <Text style={s.title}>Create Account</Text>
          <Text style={s.subtitle}>Join AFI Crafted to manage your projects</Text>
        </View>

        <View style={s.form}>
          <View style={s.inputContainer}>
            <Ionicons name="person-outline" size={20} color={C.textMuted} style={s.inputIcon} />
            <TextInput
              style={s.input}
              placeholder="Full Name"
              placeholderTextColor={C.textMuted}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={s.inputContainer}>
            <Ionicons name="mail-outline" size={20} color={C.textMuted} style={s.inputIcon} />
            <TextInput
              style={s.input}
              placeholder="Email Address"
              placeholderTextColor={C.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={s.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color={C.textMuted} style={s.inputIcon} />
            <TextInput
              style={s.input}
              placeholder="Password"
              placeholderTextColor={C.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[s.button, loading && s.buttonDisabled]}
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.buttonText}>Sign Up</Text>
            )}
          </TouchableOpacity>

          <View style={s.footer}>
            <Text style={s.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={s.link}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(C: ReturnType<typeof getColors>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    content: { flex: 1, padding: 24, justifyContent: 'center' },
    header: { alignItems: 'center', marginBottom: 40 },
    logo: { width: 100, height: 100, marginBottom: 20 },
    title: { fontSize: 28, fontWeight: 'bold', color: C.text, marginBottom: 8 },
    subtitle: { fontSize: 16, color: C.textSub, textAlign: 'center' },
    form: { gap: 16 },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: C.card,
      borderRadius: 12,
      paddingHorizontal: 16,
      height: 56,
      borderWidth: 1,
      borderColor: C.border,
    },
    inputIcon: { marginRight: 12 },
    input: { flex: 1, color: C.text, fontSize: 16 },
    button: {
      backgroundColor: C.accent,
      height: 56,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 8,
      shadowColor: C.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    buttonDisabled: { opacity: 0.7 },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
    footerText: { color: C.textSub, fontSize: 14 },
    link: { color: C.accentText, fontSize: 14, fontWeight: 'bold' },
  });
}
