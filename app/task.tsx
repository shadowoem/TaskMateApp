import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
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
import { supabase } from "../lib/supabase";

interface TaskDTO {
  id: string;
  title: string;
  description?: string;
  image?: string;
  checklist_id: string;
  completed: boolean;
  created_at: string;
  likes: number;
}

interface CommentDTO {
  id: string;
  text: string;
  created_at: string;
  user_id: string;
  user_name: string;
  avatar_url?: string;
}

export default function TaskScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { taskId } = route.params as { taskId: string };

  const [task, setTask] = useState<TaskDTO | null>(null);
  const [comments, setComments] = useState<CommentDTO[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchTask();
    fetchComments();
  }, [taskId]);

  const fetchTask = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", taskId)
      .single();

    if (!error) {
      setTask(data as TaskDTO);
    } else {
      console.error(error);
    }
    setIsLoading(false);
  };

  const fetchComments = async () => {
    // Обновлённый запрос для получения аватарок
    const { data, error } = await supabase
      .from("comments")
      .select(
        `
    id, 
    text, 
    created_at, 
    user_id,
    profiles:user_id (username, avatar_url)
  `
      )
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });

    if (!error && data) {
      const formattedComments = data.map((comment) => ({
        id: comment.id,
        text: comment.text,
        created_at: comment.created_at,
        user_id: comment.user_id,
        user_name: comment.profiles?.username || "Аноним",
        avatar_url: comment.profiles?.avatar_url || null,
      }));
      setComments(formattedComments);
    }
  };

  const handleLike = async () => {
    if (!task) return;

    const updatedLikes = task.likes + 1;
    setTask({ ...task, likes: updatedLikes });

    await supabase
      .from("tasks")
      .update({ likes: updatedLikes })
      .eq("id", task.id);
  };

  const handleAddComment = async () => {
    if (!task || !newComment.trim()) return;

    setIsSending(true);

    try {
      // Получаем текущего пользователя
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Пользователь не авторизован");

      // Добавляем комментарий
      const { data, error } = await supabase
        .from("comments")
        .insert({
          text: newComment,
          task_id: task.id,
          user_id: user.id,
        })
        .select("id, text, created_at, user_id");

      if (error) throw error;

      // Получаем профиль пользователя с аватаркой
      const { data: profile } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", user.id)
        .single();

      // Добавляем комментарий в локальное состояние
      setComments((prev) => [
        ...prev,
        {
          ...data[0],
          user_name: profile?.username || "Аноним",
          avatar_url: profile?.avatar_url || null,
        },
      ]);

      setNewComment("");
    } catch (error) {
      console.error("Ошибка добавления комментария:", error);
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading || !task) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#237AE6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#237AE6" />
        </TouchableOpacity>
      </View>

      {/* Content Container */}
      <View style={styles.gradientBackground}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.contentContainer}>
            {/* Task Header - Изменения здесь */}
            <View style={styles.taskHeader}>
              <Text style={styles.taskTitle}>{task.title}</Text>
            </View>

            {/* Task Image */}
            {task.image ? (
              <Image
                source={{ uri: task.image }}
                style={styles.taskImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <MaterialIcons name="image" size={40} color="#ccc" />
              </View>
            )}

            <Text style={styles.taskDescription}>
              {task.description || "Описание отсутствует"}
            </Text>

            {/* Likes Section */}
            <View style={styles.likesContainer}>
              <TouchableOpacity style={styles.likeButton} onPress={handleLike}>
                <MaterialIcons name="favorite" size={24} color="#237AE6" />
              </TouchableOpacity>
              <Text style={styles.likesCount}>{task.likes} </Text>
            </View>

            {/* Comments List */}
            <View style={styles.commentsSection}>
              {comments.length === 0 ? (
                <Text style={styles.noCommentsText}>Пока нет комментариев</Text>
              ) : (
                comments.map((comment) => (
                  <View key={comment.id} style={styles.commentItem}>
                    {/* Аватар пользователя */}
                    {comment.avatar_url ? (
                      <Image
                        source={{ uri: comment.avatar_url }}
                        style={styles.commentAvatar}
                      />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <MaterialIcons name="person" size={16} color="#fff" />
                      </View>
                    )}

                    <View style={styles.commentContent}>
                      <Text style={styles.commentUsername}>
                        {comment.user_name}
                      </Text>
                      <Text style={styles.commentText}>{comment.text}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Comment Input */}
      <View style={styles.commentInputContainer}>
        <TextInput
          style={styles.commentInput}
          placeholder="Добавить комментарий..."
          value={newComment}
          onChangeText={setNewComment}
          editable={!isSending}
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={handleAddComment}
          disabled={isSending || !newComment.trim()}
        >
          <MaterialIcons
            name={isSending ? "hourglass-top" : "send"}
            size={24}
            color={isSending ? "#ccc" : "#237AE6"}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingTop: 50,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    zIndex: 2,
  },
  headerTitle: {
    color: "#237AE6",
    fontSize: 20,
    fontWeight: "bold",
  },
  headerIcons: {
    flexDirection: "row",
    gap: 15,
  },
  taskHeader: {
    marginBottom: 20,
    alignItems: "center",
  },
  taskTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#237AE6",
    marginBottom: 8,
    textAlign: "center",
  },
  iconButton: {
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
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

  taskDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  taskImage: {
    width: "100%",
    height: 300,
    borderRadius: 12,
    marginBottom: 16,
  },
  imagePlaceholder: {
    width: "100%",
    height: 200,
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  likesContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  likeButton: {
    padding: 8,
  },
  likesCount: {
    fontSize: 16,
    fontWeight: "500",
    color: "#237AE6",
  },
  commentsSection: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  noCommentsText: {
    color: "#999",
    textAlign: "center",
    marginVertical: 10,
    fontSize: 16,
  },
  commentItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#237AE6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentUsername: {
    fontWeight: "bold",
    color: "#237AE6",
    marginBottom: 4,
    fontSize: 14,
  },
  commentText: {
    fontSize: 16,
    color: "#333",
    lineHeight: 22,
  },
  commentInputContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  commentInput: {
    flex: 1,
    padding: 12,
    paddingLeft: 16,
    backgroundColor: "#f9f9f9",
    borderRadius: 24,
    marginRight: 10,
    fontSize: 16,
  },
  sendButton: {
    padding: 8,
  },
});
