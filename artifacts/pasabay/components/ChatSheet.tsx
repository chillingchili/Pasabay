import React, { useEffect, useRef, useState } from "react";
import { Animated, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "react-native-paper";
import { TextInput, IconButton, Surface, Button } from "react-native-paper";

interface Message {
  id: string;
  text: string;
  sender: "driver" | "passenger";
  time: string;
}

interface ChatSheetProps {
  visible: boolean;
  onClose: () => void;
  driverName: string;
}

const MOCK_MESSAGES: Message[] = [
  { id: "1", text: "I'm on my way to the pickup point", sender: "driver", time: "2:34 PM" },
  { id: "2", text: "Sure, I'll be waiting at the main gate", sender: "passenger", time: "2:35 PM" },
  { id: "3", text: "Almost there, about 2 minutes", sender: "driver", time: "2:37 PM" },
];

export function ChatSheet({ visible, onClose, driverName }: ChatSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(300)).current;
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [inputText, setInputText] = useState("");

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 10, useNativeDriver: true }).start();
    } else {
      slideAnim.setValue(300);
    }
  }, [visible, slideAnim]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    const newMsg: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: "passenger",
      time: new Date().toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" }),
    };
    setMessages(prev => [...prev, newMsg]);
    setInputText("");
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardView}
        >
          <Animated.View
            style={[
              styles.sheet,
              {
                backgroundColor: colors.surface,
                paddingBottom: Math.max(insets.bottom, 16),
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={[styles.header, { borderBottomColor: colors.outline }]}>
              <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarText}>{driverName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.headerName, { color: colors.onSurface, fontFamily: "Inter_600SemiBold" }]}>{driverName}</Text>
                <Text style={[styles.headerStatus, { color: colors.onSurfaceVariant, fontFamily: "Inter_400Regular" }]}>Active ride</Text>
              </View>
              <Pressable onPress={onClose} style={styles.closeBtn}>
                <Feather name="x" size={20} color={colors.onSurfaceVariant} />
              </Pressable>
            </View>

            <ScrollView style={styles.messages} contentContainerStyle={styles.messagesContent}>
              {messages.map(msg => (
                <View
                  key={msg.id}
                  style={[
                    styles.messageRow,
                    msg.sender === "passenger" ? styles.messageRowRight : styles.messageRowLeft,
                  ]}
                >
                  <View
                    style={[
                      styles.messageBubble,
                      msg.sender === "passenger"
                        ? { backgroundColor: colors.primary }
                        : { backgroundColor: colors.surfaceVariant },
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        {
                          color: msg.sender === "passenger" ? "#fff" : colors.onSurface,
                          fontFamily: "Inter_400Regular",
                        },
                      ]}
                    >
                      {msg.text}
                    </Text>
                  </View>
                  <Text style={[styles.messageTime, { color: colors.onSurfaceDisabled, fontFamily: "Inter_400Regular" }]}>{msg.time}</Text>
                </View>
              ))}
            </ScrollView>

            <View style={[styles.inputRow, { borderTopColor: colors.outline, backgroundColor: colors.surface }]}>
              <TextInput
                mode="outlined"
                style={[styles.input, { backgroundColor: colors.surfaceVariant }]}
                outlineStyle={{ borderRadius: 20, borderColor: "transparent" }}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Type a message..."
                placeholderTextColor={colors.onSurfaceDisabled}
                multiline
                dense
              />
              <IconButton
                icon="send"
                iconColor={colors.onPrimary}
                containerColor={colors.primary}
                size={22}
                onPress={handleSend}
                style={{ marginBottom: 0 }}
              />
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)" },
  keyboardView: { justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "92%",
    display: "flex",
    flexDirection: "column",
  },
  header: { flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 14, fontFamily: "Sora_800ExtraBold" },
  headerName: { fontSize: 15 },
  headerStatus: { fontSize: 12 },
  closeBtn: { padding: 8 },
  messages: { flex: 1 },
  messagesContent: { padding: 16, gap: 12 },
  messageRow: { maxWidth: "80%" },
  messageRowLeft: { alignSelf: "flex-start" },
  messageRowRight: { alignSelf: "flex-end", alignItems: "flex-end" },
  messageBubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16 },
  messageText: { fontSize: 14 },
  messageTime: { fontSize: 10, marginTop: 4 },
  inputRow: { flexDirection: "row", alignItems: "flex-end", padding: 12, gap: 10, borderTopWidth: 1 },
  input: { flex: 1, fontSize: 14 },
});
