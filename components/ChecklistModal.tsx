import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ChecklistDTO, supabase } from "../lib/supabase";

interface ChecklistModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  onSave: () => void;
}

export const ChecklistModal: React.FC<ChecklistModalProps> = ({
  visible,
  onClose,
  userId,
  onSave,
}) => {
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [photo, setPhoto] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!supabase) return;
    const newChecklist: ChecklistDTO = {
      owner_id: userId,
      name,
      description,
      photo: photo || undefined,
      members: [userId],
      state: "active",
    };

    const { error } = await supabase.from("checklists").insert(newChecklist);

    if (!error) {
      onSave();
      onClose();
      resetForm();
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0].uri) {
      setPhoto(result.assets[0].uri);
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setPhoto(null);
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
          <Text style={styles.title}>Новый чеклист</Text>

          <View style={styles.photoRow}>
            <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
              {photo ? (
                <Image source={{ uri: photo }} style={styles.photoImage} />
              ) : (
                <>
                  <MaterialIcons name="add-a-photo" size={24} color="#237AE6" />
                  <Text style={styles.photoText}>Выбрать фото</Text>
                </>
              )}
            </TouchableOpacity>

            <TextInput
              placeholder="Название чеклиста"
              placeholderTextColor="#888"
              value={name}
              onChangeText={setName}
              style={styles.nameInput}
            />
          </View>

          <TextInput
            placeholder="Описание..."
            placeholderTextColor="#888"
            value={description}
            onChangeText={setDescription}
            multiline
            style={styles.descriptionInput}
          />

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Отмена</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.createButton, !name && styles.disabledButton]}
              onPress={handleCreate}
              disabled={!name}
            >
              <Text style={styles.createButtonText}>Создать</Text>
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
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  photoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    marginBottom: 20,
  },
  photoButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#237AE6",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  photoImage: {
    width: "100%",
    height: "100%",
    borderRadius: 50,
  },
  photoText: {
    color: "#237AE6",
    fontSize: 12,
    marginTop: 5,
    textAlign: "center",
  },
  nameInput: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  descriptionInput: {
    height: 120,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    textAlignVertical: "top",
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
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
