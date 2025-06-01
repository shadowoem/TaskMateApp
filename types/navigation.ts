import type { StackNavigationProp } from "@react-navigation/stack"; // Изменяем импорт

export type RootStackParamList = {
  Auth: undefined;
  Register: undefined;
  Home: undefined;
  Checklist: { id: string };
};

// Для всех экранов используем StackNavigationProp
export type ChecklistScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Checklist"
>;

export type HomeScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Home"
>;

export type RegisterScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Register"
>;

export type AuthScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Auth"
>;
