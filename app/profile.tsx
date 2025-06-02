import { MaterialIcons } from "@expo/vector-icons";
import { useRoute } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Header } from "../components/Header"; // Импортируем компонент
import { supabase } from "../lib/supabase";

const ProfileScreen = () => {
  const route = useRoute();
  const { userId } = route.params;

  const navigation = useNavigation();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [newBio, setNewBio] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [tempAvatarUri, setTempAvatarUri] = useState(null);
  const [avatarVersion, setAvatarVersion] = useState(0); // Для обхода кеширования

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, bio")
        .eq("id", userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (err) {
      setError("Ошибка загрузки профиля: " + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  useEffect(() => {
    fetchCurrentUser();
    fetchProfile();
  }, [userId]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Ошибка выхода:", error);
    } else {
      navigation.navigate("login");
    }
  };

  const handleUpdateBio = async () => {
    if (!newBio.trim()) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from("profiles")
        .update({ bio: newBio })
        .eq("id", profile.id);

      if (error) throw error;

      setProfile((prev) => ({ ...prev, bio: newBio }));
      setIsEditingBio(false);
    } catch (err) {
      setError("Ошибка обновления био: " + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    setUploading(true);

    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Требуется разрешение",
          "Необходимо разрешение на доступ к фотографиям"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled) {
        setUploading(false);
        return;
      }

      if (!result.canceled && result.assets[0].uri) {
        setTempAvatarUri(result.assets[0].uri);
      }
    } catch (err) {
      setError("Ошибка выбора фото: " + err.message);
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const saveProfileChanges = async () => {
    try {
      setUploading(true);

      // Обновляем bio
      if (isEditingBio && newBio.trim() && newBio !== profile?.bio) {
        const { error } = await supabase
          .from("profiles")
          .update({ bio: newBio })
          .eq("id", profile.id);

        if (error) throw error;
        setProfile((prev) => ({ ...prev, bio: newBio }));
      }

      // Обновляем аватар
      if (tempAvatarUri) {
        const fileExt = tempAvatarUri.split(".").pop();
        const fileName = `${profile.id}.${fileExt}`;
        const filePath = `${fileName}`;

        const response = await fetch(tempAvatarUri);
        const blob = await response.blob();

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, blob, { upsert: true });

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("avatars").getPublicUrl(filePath);

        const { error: updateError } = await supabase
          .from("profiles")
          .update({ avatar_url: publicUrl })
          .eq("id", profile.id);

        if (updateError) throw updateError;

        // Обновляем профиль и версию аватара
        setProfile((prev) => ({ ...prev, avatar_url: publicUrl }));
        setAvatarVersion((v) => v + 1); // Ключевое изменение!
      }

      setTempAvatarUri(null);
      setIsEditingBio(false);
      Alert.alert("Успешно", "Профиль обновлен!");
    } catch (err) {
      setError("Ошибка обновления профиля: " + err.message);
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#237AE6" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchProfile}>
          <Text style={styles.retryButtonText}>Повторить</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isCurrentUser = currentUserId === userId;
  const showSaveButton = isCurrentUser && (isEditingBio || tempAvatarUri);

  return (
    <View style={styles.container}>
      <Header
        onHomePress={() => navigation.navigate("index")}
        onProfilePress={() =>
          navigation.navigate("profile", { userId: currentUserId })
        }
        userId={currentUserId}
      />

      <View style={styles.gradientBackground}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.contentContainer}>
            {/* Avatar Block */}
            <View style={styles.avatarContainer}>
              {uploading ? (
                <View style={styles.avatarPlaceholder}>
                  <ActivityIndicator size="large" color="#fff" />
                </View>
              ) : tempAvatarUri ? (
                <Image source={{ uri: tempAvatarUri }} style={styles.avatar} />
              ) : profile?.avatar_url ? (
                <Image
                  // Добавляем параметр версии к URI
                  source={{ uri: `${profile.avatar_url}?v=${avatarVersion}` }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <MaterialIcons name="person" size={48} color="#fff" />
                </View>
              )}

              {isCurrentUser && !uploading && (
                <TouchableOpacity
                  style={styles.photoButton}
                  onPress={pickImage}
                >
                  {tempAvatarUri ? (
                    <MaterialIcons name="refresh" size={24} color="#237AE6" />
                  ) : (
                    <>
                      <MaterialIcons
                        name="add-a-photo"
                        size={24}
                        color="#237AE6"
                      />
                      <Text style={styles.photoText}>Изменить</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              <Text style={styles.username}>
                @{profile?.username || "Без имени"}
              </Text>
            </View>

            {/* About Block */}
            <View style={styles.aboutContainer}>
              <View style={styles.aboutHeader}>
                <Text style={styles.sectionTitle}>О себе</Text>
                {isCurrentUser && !isEditingBio && (
                  <TouchableOpacity onPress={() => setIsEditingBio(true)}>
                    <MaterialIcons name="edit" size={20} color="#237AE6" />
                  </TouchableOpacity>
                )}
              </View>

              {isEditingBio ? (
                <TextInput
                  style={styles.aboutInput}
                  value={newBio || profile?.bio || ""}
                  onChangeText={setNewBio}
                  placeholder="Напишите о себе"
                  multiline
                  numberOfLines={4}
                />
              ) : (
                <Text style={styles.bioText}>
                  {profile?.bio ||
                    "Пользователь еще не добавил информацию о себе"}
                </Text>
              )}
            </View>

            {/* Save Button */}
            {showSaveButton && (
              <TouchableOpacity
                style={styles.saveProfileButton}
                onPress={saveProfileChanges}
                disabled={uploading}
              >
                <Text style={styles.saveProfileButtonText}>
                  {uploading ? "Сохранение..." : "Сохранить изменения"}
                </Text>
              </TouchableOpacity>
            )}

            {/* Menu Buttons */}
            <View style={styles.menuContainer}>
              <TouchableOpacity style={styles.menuItem}>
                <MaterialIcons name="insert-chart" size={24} color="#237AE6" />
                <Text style={styles.menuItemText}>Статистика</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem}>
                <MaterialIcons name="archive" size={24} color="#237AE6" />
                <Text style={styles.menuItemText}>Архив</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem}>
                <MaterialIcons name="notifications" size={24} color="#237AE6" />
                <Text style={styles.menuItemText}>Уведомления</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem}>
                <MaterialIcons name="settings" size={24} color="#237AE6" />
                <Text style={styles.menuItemText}>Настройки</Text>
              </TouchableOpacity>
            </View>

            {/* Logout Button */}
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Text style={styles.logoutButtonText}>Выйти</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  gradientBackground: {
    flex: 1,
    backgroundColor: "#2567E8",
    backgroundImage: "linear-gradient(to bottom, #2567E8, #1CE6DA)",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 80,
  },
  contentContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 24,
  },

  // Avatar Block
  avatarContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#237AE6",
    justifyContent: "center",
    alignItems: "center",
  },
  photoButton: {
    marginTop: 10,
    width: 120,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#237AE6",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
  },
  photoText: {
    color: "#237AE6",
    fontSize: 14,
  },
  username: {
    fontSize: 18,
    fontWeight: "500",
    color: "#333",
    marginTop: 12,
  },

  // About Block
  aboutContainer: {
    borderWidth: 1,
    borderColor: "#237AE6",
    borderRadius: 10,
    padding: 16,
    marginBottom: 24,
  },
  aboutHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#237AE6",
  },
  aboutInput: {
    fontSize: 16,
    color: "#666",
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    minHeight: 100,
  },
  bioText: {
    fontSize: 16,
    color: "#666",
    paddingVertical: 8,
  },

  // Save Profile Button
  saveProfileButton: {
    backgroundColor: "#237AE6",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    marginBottom: 20,
  },
  saveProfileButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },

  // Menu Buttons
  menuContainer: {
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  menuItemText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 16,
  },

  // Logout Button
  logoutButton: {
    borderWidth: 1,
    borderColor: "#237AE6",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
  },
  logoutButtonText: {
    color: "#237AE6",
    fontWeight: "500",
    fontSize: 16,
  },

  // Loading and Error States
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  errorText: {
    color: "red",
    fontSize: 16,
    marginBottom: 16,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#237AE6",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default ProfileScreen;
