import AsyncStorage from '@react-native-async-storage/async-storage';
import { createSaveQueue, decodeProgress, progressKey } from '../../shared/progress';

const queue = createSaveQueue(value => AsyncStorage.setItem(progressKey, value));
export const saveProgress = queue.save;

export async function loadProgress() {
  await queue.whenIdle();
  return decodeProgress(await AsyncStorage.getItem(progressKey));
}
