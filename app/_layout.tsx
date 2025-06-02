import * as Linking from "expo-linking";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import "../shim";

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();

  // Обработка deep links
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      const parsed = Linking.parse(event.url);

      // Обрабатываем ссылки вида: https://taskmate.app/join/:id
      if (parsed.path?.startsWith("/join/")) {
        const id = parsed.path.split("/")[2];
        if (id) {
          router.replace(`/join?id=${id}`);
        }
      }
    };

    // Слушаем входящие ссылки
    const subscription = Linking.addEventListener("url", handleDeepLink);

    // Проверяем начальную ссылку при открытии приложения
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    return () => subscription.remove();
  }, []);

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="checklist" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
      <Stack.Screen name="task" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ headerShown: false }} />
      <Stack.Screen
        name="join"
        options={{
          headerShown: false,
          // Указываем, что экран должен открываться как модальное окно
          presentation: "modal",
        }}
      />
    </Stack>
  );
}
