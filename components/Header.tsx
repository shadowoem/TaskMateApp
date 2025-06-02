import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface HeaderProps {
  onHomePress: () => void;
  onProfilePress: () => void;
  userId: string | null;
}

export const Header = ({
  onHomePress,
  onProfilePress,
  userId,
}: HeaderProps) => (
  <View style={styles.header}>
    <TouchableOpacity onPress={onHomePress}>
      <Text style={styles.headerTitle}>TaskMate</Text>
    </TouchableOpacity>
    <View style={styles.headerIcons}>
      <TouchableOpacity style={styles.iconButton}>
        <MaterialIcons name="more-vert" size={24} color="#237AE6" />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.iconButton}
        onPress={onProfilePress}
        disabled={!userId}
      >
        <MaterialIcons name="person" size={24} color="#237AE6" />
      </TouchableOpacity>
    </View>
  </View>
);

const styles = StyleSheet.create({
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
    fontSize: 24,
    fontWeight: "bold",
  },
  headerIcons: {
    flexDirection: "row",
    gap: 15,
  },
  iconButton: {
    padding: 5,
  },
});
