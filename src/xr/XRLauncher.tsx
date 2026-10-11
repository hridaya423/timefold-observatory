import { router } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function XRLauncher() {
  return (
    <SafeAreaView style={styles.screen}>
      <Text style={styles.title}>The observatory needs a device</Text>
      <Text style={styles.body}>TimeFold runs on AR-capable phones and Meta Quest. Open this build on a device to step inside — or explore the same rules right here in the 2D logic lab.</Text>
      <Pressable accessibilityRole="button" onPress={() => router.push('/lab')} style={styles.button}><Text style={styles.buttonText}>Open logic lab</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={() => router.replace('/')} style={[styles.button, styles.secondary]}><Text style={styles.buttonText}>Return home</Text></Pressable>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#141817', padding: 28, justifyContent: 'center', gap: 24 },
  title: { color: '#eee9df', fontSize: 28, fontWeight: '600' },
  body: { color: '#ccc9c0', fontSize: 16, lineHeight: 26 },
  button: { padding: 18, backgroundColor: '#d7b47b', alignItems: 'center' },
  secondary: { backgroundColor: '#596b62' },
  buttonText: { color: '#141817', fontSize: 16, fontWeight: '600' },
});
