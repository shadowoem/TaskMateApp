// navigation/AppNavigator.tsx
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import AuthScreen from "../app/AuthScreen";
import ChecklistScreen from "../app/ChecklistScreen"; // Убедитесь в правильности импорта
import RegisterScreen from "../app/RegisterScreen";
import HomeScreen from "../app/index";

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: "transparent" },
        }}
      >
        {/* Добавьте маршрут для ChecklistScreen */}
        <Stack.Screen
          name="Checklist"
          component={ChecklistScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
