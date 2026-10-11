import Constants from 'expo-constants';
import { router, useLocalSearchParams } from 'expo-router';
import { isQuest, ViroXRSceneNavigator } from '@reactvision/react-viro';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import PhoneScene from './PhoneScene';
import QuestScene from './QuestScene';
import TimeFoldPhoneScene from './TimeFoldPhoneScene';
import TimeFoldQuestScene from './TimeFoldQuestScene';

export default function XRLauncher() {
  const insets = useSafeAreaInsets();
  const { view } = useLocalSearchParams();
  const inspecting = view === 'observatory';
  const metaAppId: unknown = Constants.expoConfig?.extra?.metaAppId;
  const questConfigured = typeof metaAppId === 'string' && /^\d+$/.test(metaAppId);
  if (isQuest && !questConfigured) {
    return (
      <SafeAreaView style={styles.screen}>
        <Text style={styles.title}>Set the Meta App ID first</Text>
        <Text style={styles.body}>Configure the real numeric META_APP_ID and rebuild before launching the immersive Quest diagnostic.</Text>
        <Pressable accessibilityRole="button" onPress={() => router.replace('/')} style={styles.button}><Text style={styles.buttonText}>Return home</Text></Pressable>
      </SafeAreaView>
    );
  }
  return (
    <View style={styles.navigator}>
      <ViroXRSceneNavigator arInitialScene={{ scene: inspecting ? TimeFoldPhoneScene : PhoneScene }} vrInitialScene={{ scene: inspecting ? TimeFoldQuestScene : QuestScene }}
        onExitViro={() => router.replace('/')} hdrEnabled={false} bloomEnabled={false} handTrackingEnabled={false} style={styles.navigator} />
      {!isQuest && <Pressable accessibilityRole="button" onPress={() => router.replace('/')} style={[styles.exit, { top: insets.top + 8 }]}><Text style={styles.buttonText}>Return home</Text></Pressable>}
    </View>
  );
}
const styles = StyleSheet.create({
  navigator: { flex: 1 },
  exit: { position: 'absolute', left: 16, backgroundColor: '#d7b47b', padding: 14 },
  screen: { flex: 1, backgroundColor: '#141817', padding: 28, justifyContent: 'center', gap: 24 },
  title: { color: '#eee9df', fontSize: 28, fontWeight: '600' },
  body: { color: '#ccc9c0', fontSize: 16, lineHeight: 26 },
  button: { padding: 18, backgroundColor: '#d7b47b', alignItems: 'center' },
  buttonText: { color: '#141817', fontSize: 16, fontWeight: '600' },
});
