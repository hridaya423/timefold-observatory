import '../xr/bootstrap';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#141817' } }} />
      <StatusBar style="light" />
    </>
  );
}
