import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

function keyFor(userId: string) {
  return `profile_avatar_uri:${userId}`;
}

export async function getAvatarUri(userId: string): Promise<string | null> {
  const key = keyFor(userId);
  if (Platform.OS === "web") return localStorage.getItem(key);
  return AsyncStorage.getItem(key);
}

export async function setAvatarUri(userId: string, uri: string): Promise<void> {
  const key = keyFor(userId);
  if (Platform.OS === "web") {
    localStorage.setItem(key, uri);
    return;
  }
  await AsyncStorage.setItem(key, uri);
}

export async function clearAvatarUri(userId: string): Promise<void> {
  const key = keyFor(userId);
  if (Platform.OS === "web") {
    localStorage.removeItem(key);
    return;
  }
  await AsyncStorage.removeItem(key);
}
