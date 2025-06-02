// app/index.tsx
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ChecklistModal } from "../components/ChecklistModal";
import { Header } from "../components/Header"; // Импортируем новый компонент
import { supabase } from "../lib/supabase";

type Checklist = {
  id: string;
  name: string;
  description?: string;
  photo?: string;
};

export default function HomeScreen() {
  const navigation = useNavigation();
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
      } else {
        navigation.navigate("auth");
      }
      setLoading(false);
    };

    fetchUser();
    fetchChecklists();
  }, []);

  const fetchChecklists = async () => {
    if (!supabase) return;
    const { data, error } = await supabase.from("checklists").select("*");
    if (!error && data) setChecklists(data as Checklist[]);
  };

  const filteredChecklists = checklists.filter(
    (checklist) =>
      checklist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      checklist.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#237AE6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Используем новый компонент Header */}
      <Header
        onHomePress={() => navigation.navigate("index")}
        onProfilePress={() => navigation.navigate("profile", { userId })}
        userId={userId}
      />

      <View style={styles.gradientBackground}>
        <View style={styles.contentContainer}>
          <View style={styles.searchRow}>
            <TextInput
              placeholder="Поиск по названию..."
              placeholderTextColor="#888"
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
            />
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setModalVisible(true)}
            >
              <MaterialIcons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {filteredChecklists.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.card}
                onPress={() =>
                  navigation.navigate("checklist", { id: item.id })
                }
              >
                <View style={styles.cardContent}>
                  {item.photo ? (
                    <Image
                      source={{ uri: item.photo }}
                      style={styles.cardImage}
                    />
                  ) : (
                    <View style={[styles.cardImage, styles.emptyImage]}>
                      <MaterialIcons name="checklist" size={24} color="#fff" />
                    </View>
                  )}
                  <View style={styles.textContainer}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.cardDescription} numberOfLines={2}>
                      {item.description}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      <ChecklistModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={fetchChecklists}
        userId={userId}
      />
    </View>
  );
}

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
  contentContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    padding: 16,
    minHeight: 200,
    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
    elevation: 5,
  },
  searchRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  cardImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#237AE6",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyImage: {
    backgroundColor: "#1D4AE6",
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  addButton: {
    backgroundColor: "#237AE6",
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});
