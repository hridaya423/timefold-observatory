import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SetupScreen() {
  const metaAppId: unknown = Constants.expoConfig?.extra?.metaAppId;
  const questConfigured = typeof metaAppId === 'string' && /^\d+$/.test(metaAppId);
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.back}><Text style={styles.link}>Back</Text></Pressable>
        <Text style={styles.title}>Setup requirements</Text>
        <Text style={styles.body}>Quest App ID: {questConfigured ? 'configured' : 'missing'}</Text>
        <Text style={styles.body}>Quest requires a real Meta App ID, Developer Mode and USB debugging authorization. Set META_APP_ID before regenerating and compiling the native project.</Text>
        <Text style={styles.body}>Phone AR requires a physical ARKit iPhone or ARCore Android device. Select a horizontal surface in a well-lit room.</Text>
        <Text style={styles.body}>The iPhone build must be compiled and signed on the arranged Mac. Expo Go, browser previews and compilation alone do not prove native AR.</Text>
        <Text style={styles.body}>The Gemini keeper is not connected in this checkpoint. No live AI request or paid operation is made.</Text>
        <Text style={styles.note}>Dependency advisories remain release blockers. This checkpoint is approved for controlled local development only.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#141817' },
  content: { padding: 28, gap: 24, maxWidth: 720, width: '100%', alignSelf: 'center' },
  back: { paddingVertical: 12 },
  link: { color: '#d7b47b', fontSize: 16 },
  title: { color: '#eee9df', fontSize: 30, fontWeight: '600' },
  body: { color: '#ccc9c0', fontSize: 16, lineHeight: 26 },
  note: { color: '#aaa79e', fontSize: 13, lineHeight: 21 },
});
