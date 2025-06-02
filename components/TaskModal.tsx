import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
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
  const [image, setImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleCreate = () => {
    if (!title.trim() || isProcessing) return;

    const newTask: Omit<TaskDTO, "id"> = {
      title: title.trim(),
      description: description.trim(),
      image: image || null,
      checklist_id: checklistId,
      completed: false,
      likes: 0,
      created_at: new Date().toISOString(),
    };

    onSave(newTask);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setImage(null);
  };

  const pickImage = async () => {
    if (isProcessing || isUploading) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setIsUploading(true);

        // В реальном приложении здесь должна быть загрузка на сервер
        // Для примера используем локальный URI
        setImage(result.assets[0].uri);

        setIsUploading(false);
      }
    } catch (error) {
      console.error("Ошибка выбора изображения:", error);
      setIsUploading(false);
    }
  };

  const removeImage = () => {
    setImage(null);
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

          {/* Поле для загрузки изображения */}
          <View style={styles.imageSection}>
            <Text style={styles.sectionLabel}>Изображение задачи</Text>

            {image ? (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: image }} style={styles.imagePreview} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={removeImage}
                  disabled={isProcessing}
                >
                  <MaterialIcons name="close" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.imagePicker}
                onPress={pickImage}
                disabled={isProcessing || isUploading}
              >
                {isUploading ? (
                  <ActivityIndicator size="small" color="#237AE6" />
                ) : (
                  <>
                    <MaterialIcons
                      name="add-a-photo"
                      size={24}
                      color="#237AE6"
                    />
                    <Text style={styles.imagePickerText}>
                      Выбрать изображение
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

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
                (!title || isProcessing || isUploading) &&
                  styles.disabledButton,
              ]}
              onPress={handleCreate}
              disabled={!title || isProcessing || isUploading}
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
    maxHeight: "90%",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  imageSection: {
    marginBottom: 15,
  },
  sectionLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    fontWeight: "500",
  },
  imagePicker: {
    height: 120,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
  },
  imagePickerText: {
    color: "#237AE6",
    marginTop: 8,
    fontSize: 14,
  },
  imagePreviewContainer: {
    position: "relative",
  },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: 12,
  },
  removeImageButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
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
