import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard"; // Для копирования в буфер обмена
import * as WebBrowser from "expo-web-browser"; // Для открытия ссылок
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageURISource,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Header } from "../components/Header";
import { TaskModal } from "../components/TaskModal";
import { ChecklistDTO, supabase } from "../lib/supabase";

interface TaskDTO {
  id: string;
  title: string;
  description?: string;
  checklist_id: string;
  completed: boolean;
  created_at: string;
}

interface RouteParams {
  id: string;
}

export default function ChecklistScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = route.params as RouteParams;

  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);

  const [checklist, setChecklist] = useState<ChecklistDTO | null>(null);
  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null); // Для хедера

  useEffect(() => {
    let isMounted = true;

    // Получаем ID текущего пользователя
    const fetchCurrentUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUserId(session.user.id);
      }
    };

    const fetchData = async () => {
      setIsLoading(true);
      setChecklist(null);
      setTasks([]);

      try {
        const [checklistRes, tasksRes] = await Promise.all([
          supabase.from("checklists").select("*").eq("id", id).single(),
          supabase
            .from("tasks")
            .select("*")
            .eq("checklist_id", id)
            .order("created_at", { ascending: true }),
        ]);

        if (isMounted) {
          if (checklistRes.data && !checklistRes.error) {
            setChecklist(checklistRes.data);
          }
          if (tasksRes.data && !tasksRes.error) {
            setTasks(tasksRes.data);
          }
        }
      } catch (error) {
        console.error("Ошибка загрузки:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchCurrentUser();
    fetchData();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const addTaskOptimistic = async (newTask: Omit<TaskDTO, "id">) => {
    if (!supabase) return;
    const tempId = `temp-${Date.now()}`;
    const tempTask: TaskDTO = { ...newTask, id: tempId };

    setIsProcessing(true);
    setTasks((prev) => [...prev, tempTask]);

    try {
      const { data, error } = await supabase
        .from("tasks")
        .insert(newTask)
        .select("*");

      if (error) throw error;

      setTasks((prev) =>
        prev.map((task) => (task.id === tempId ? (data[0] as TaskDTO) : task))
      );
    } catch (error) {
      setTasks((prev) => prev.filter((task) => task.id !== tempId));
      alert("Ошибка создания задачи");
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleTask = async (taskId: string) => {
    if (!supabase) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const updatedTasks = tasks.map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );

    setTasks(updatedTasks);

    await supabase
      .from("tasks")
      .update({ completed: !task.completed })
      .eq("id", taskId);
  };

  const handleShareChecklist = async () => {
    if (!checklist) return;

    setIsGeneratingLink(true);

    try {
      // Создаем запись приглашения в базе данных
      const { data: inviteData, error: inviteError } = await supabase
        .from("invitations")
        .insert({
          checklist_id: checklist.id,
          created_by: currentUserId,
          expires_at: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
          ).toISOString(), // Срок действия 7 дней
        })
        .select("id")
        .single();

      if (inviteError) throw inviteError;

      // Формируем ссылку-приглашение
      const link = `http://localhost:8081/join/${inviteData.id}`;
      setInviteLink(link);

      // Копируем ссылку в буфер обмена
      await Clipboard.setStringAsync(link);

      // Показываем опции для пользователя
      Alert.alert(
        "Приглашение создано",
        "Ссылка скопирована в буфер обмена. Вы можете отправить ее другим пользователям.",
        [
          {
            text: "Открыть ссылку",
            onPress: () => WebBrowser.openBrowserAsync(link),
            style: "default",
          },
          {
            text: "OK",
            style: "cancel",
          },
        ]
      );
    } catch (error) {
      console.error("Ошибка создания приглашения:", error);
      Alert.alert("Ошибка", "Не удалось создать ссылку для приглашения");
    } finally {
      setIsGeneratingLink(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#237AE6" />
      </View>
    );
  }

  if (!checklist) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Чеклист не найден</Text>
      </View>
    );
  }

  const completedTasks = tasks.filter((task) => task.completed).length;

  return (
    <View style={styles.container}>
      {/* Используем компонент Header */}
      <Header
        onHomePress={() => navigation.navigate("index")}
        onProfilePress={() =>
          navigation.navigate("profile", { userId: currentUserId })
        }
        userId={currentUserId}
      />

      {/* Content Container */}
      <View style={styles.gradientBackground}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.contentContainer}>
            {/* Checklist Header */}
            <View style={styles.checklistHeader}>
              {checklist.photo ? (
                <Image
                  source={{ uri: checklist.photo } as ImageURISource}
                  style={styles.checklistImage}
                />
              ) : (
                <View style={styles.checklistImagePlaceholder}>
                  <MaterialIcons name="checklist" size={32} color="#fff" />
                </View>
              )}
              <View style={styles.checklistInfo}>
                <Text style={styles.checklistTitle}>{checklist.name}</Text>
                <Text style={styles.checklistDescription}>
                  {checklist.description}
                </Text>
                <View style={styles.membersContainer}>
                  <MaterialIcons name="people" size={16} color="#666" />
                  <Text style={styles.membersCount}>
                    {checklist.members?.length || 0} участников
                  </Text>
                </View>
              </View>
            </View>

            {/* Tasks List */}
            <ScrollView>
              {tasks.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.taskItem,
                    item.id.startsWith("temp-") && styles.processingTask,
                  ]}
                  onPress={() =>
                    navigation.navigate("task", { taskId: item.id })
                  }
                  disabled={item.id.startsWith("temp-")}
                >
                  <TouchableOpacity
                    onPress={() => toggleTask(item.id)}
                    disabled={item.id.startsWith("temp-")}
                  >
                    <MaterialIcons
                      name={
                        item.completed ? "check-box" : "check-box-outline-blank"
                      }
                      size={24}
                      color="#237AE6"
                    />
                  </TouchableOpacity>
                  <View style={styles.taskTextContainer}>
                    <Text style={styles.taskTitle}>{item.title}</Text>
                    {item.description && (
                      <Text style={styles.taskDescription}>
                        {item.description}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
              {tasks.length === 0 && (
                <Text style={styles.emptyText}>Нет задач в этом чеклисте</Text>
              )}
            </ScrollView>
          </View>
        </ScrollView>

        {/* Controls Footer */}
        <View style={styles.controlsFooter}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={handleShareChecklist}
            disabled={isGeneratingLink}
          >
            {isGeneratingLink ? (
              <ActivityIndicator size="small" color="#237AE6" />
            ) : (
              <MaterialIcons name="share" size={24} color="#237AE6" />
            )}
          </TouchableOpacity>

          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              {completedTasks}/{tasks.length} выполнено
            </Text>
          </View>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setModalVisible(true)}
            disabled={isProcessing}
          >
            <MaterialIcons name="add" size={24} color="#237AE6" />
          </TouchableOpacity>
        </View>
      </View>

      <TaskModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={addTaskOptimistic}
        checklistId={id}
        isProcessing={isProcessing}
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
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 80,
  },
  contentContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
  },
  checklistHeader: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 20,
  },
  checklistImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  checklistImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#237AE6",
    justifyContent: "center",
    alignItems: "center",
  },
  checklistInfo: {
    flex: 1,
  },
  checklistTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  checklistDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 8,
  },
  membersContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  membersCount: {
    fontSize: 12,
    color: "#666",
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  processingTask: {
    opacity: 0.6,
  },
  taskTextContainer: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    color: "#333",
  },
  taskDescription: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  emptyText: {
    textAlign: "center",
    color: "#666",
    marginVertical: 20,
  },
  controlsFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 5,
  },
  controlButton: {
    padding: 8,
  },
  progressContainer: {
    alignItems: "center",
  },
  progressText: {
    color: "#237AE6",
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});
