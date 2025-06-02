import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { WebSocket } from "react-native";

const isClient = typeof window !== "undefined";

const supabaseUrl = "https://zyfbqdiydbdkauxwkdmx.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5ZmJxZGl5ZGJka2F1eHdrZG14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ1OTc1MzUsImV4cCI6MjA2MDE3MzUzNX0.KVYKjPXzQATW5ozG9_OzDWV4zEvpXsJtPPlo8TEizfA";

export const supabase = isClient
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
      realtime: {
        webSocketImplementation: WebSocket,
      },
    })
  : null;

// Типы для данных
export interface ChecklistDTO {
  owner_id: string;
  name: string;
  description?: string;
  photo?: string;
  members: string[];
  state: "active" | "archived";
}

export interface TaskDTO {
  id: string;
  title: string;
  description?: string;
  image?: string; // Добавлено поле для изображения
  checklist_id: string;
  completed: boolean;
  likes: number; // Добавлено поле для лайков
  created_at: string;
}
