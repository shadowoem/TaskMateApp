import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
import { supabase } from "../lib/supabase";

export default function JoinChecklistScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  useEffect(() => {
    const joinChecklist = async () => {
      if (!id) {
        Alert.alert("Ошибка", "Неверный идентификатор приглашения");
        router.back();
        return;
      }

      // Получаем текущего пользователя
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        Alert.alert("Ошибка", "Требуется авторизация");
        router.replace("/auth");
        return;
      }

      // Проверяем приглашение
      const { data: invite, error: inviteError } = await supabase
        .from("invitations")
        .select("*")
        .eq("id", id)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (inviteError || !invite) {
        Alert.alert(
          "Ошибка",
          "Приглашение недействительно или истек срок действия"
        );
        router.back();
        return;
      }

      // Добавляем пользователя к чеклисту
      const { error: updateError } = await supabase
        .from("checklists")
        .update({
          members: supabase.raw(`array_append(members, '${session.user.id}')`),
        })
        .eq("id", invite.checklist_id);

      if (updateError) {
        Alert.alert("Ошибка", "Не удалось присоединиться к чеклисту");
        console.error(updateError);
      } else {
        Alert.alert("Успешно", "Вы присоединились к чеклисту");
        router.replace(`/checklist?id=${invite.checklist_id}`);
      }
    };

    joinChecklist();
  }, [id]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#237AE6" />
      <Text style={styles.text}>Обработка приглашения...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  text: {
    marginTop: 20,
    fontSize: 16,
    color: "#333",
  },
});
