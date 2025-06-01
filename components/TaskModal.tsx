import { useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { TaskDTO } from "../lib/supabase";

interface TaskModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (task: Omit<TaskDTO, "id">) => void;
  checklistId: string;
  isProcessing: boolean;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  visible,
  onClose,
  onSave,
  checklistId,
  isProcessing,
}) => {
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  const handleCreate = () => {
    if (!title.trim() || isProcessing) return;

    const newTask: Omit<TaskDTO, "id"> = {
      title: title.trim(),
      description: description.trim(),
      checklist_id: checklistId,
      completed: false,
      created_at: new Date().toISOString(),
    };

    onSave(newTask);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Новая задача</Text>

          <TextInput
            placeholder="Название задачи*"
            placeholderTextColor="#888"
            value={title}
            onChangeText={setTitle}
            style={styles.input}
            editable={!isProcessing}
          />

          <TextInput
            placeholder="Описание..."
            placeholderTextColor="#888"
            value={description}
            onChangeText={setDescription}
            multiline
            style={[styles.input, styles.descriptionInput]}
            editable={!isProcessing}
          />

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={isProcessing}
            >
              <Text style={styles.cancelButtonText}>Отмена</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.createButton,
                (!title || isProcessing) && styles.disabledButton,
              ]}
              onPress={handleCreate}
              disabled={!title || isProcessing}
            >
              <Text style={styles.createButtonText}>
                {isProcessing ? "Создание..." : "Создать"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Стили остаются без изменений
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    backgroundColor: "white",
    width: "90%",
    borderRadius: 20,
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 15,
  },
  descriptionInput: {
    height: 100,
    textAlignVertical: "top",
    paddingTop: 15,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 10,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
  },
  createButton: {
    backgroundColor: "#237AE6",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
  },
  disabledButton: {
    opacity: 0.5,
  },
  createButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
});
