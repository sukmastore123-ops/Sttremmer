import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useStream } from "@/contexts/StreamContext";

interface ConfigSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function ConfigSheet({ visible, onClose }: ConfigSheetProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { config, setConfig } = useStream();
  const [rtmpUrl, setRtmpUrl] = useState(config.rtmpUrl);
  const [streamKey, setStreamKey] = useState(config.streamKey);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    if (visible) {
      setRtmpUrl(config.rtmpUrl);
      setStreamKey(config.streamKey);
    }
  }, [visible, config.rtmpUrl, config.streamKey]);

  const handleSave = async () => {
    await setConfig({ rtmpUrl: rtmpUrl.trim(), streamKey: streamKey.trim() });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.sheetWrapper}
      >
        <View style={[styles.sheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground }]}>Stream Configuration</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Feather name="x" size={22} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={[styles.label, { color: colors.mutedForeground }]}>RTMP URL</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border }]}
              value={rtmpUrl}
              onChangeText={setRtmpUrl}
              placeholder="rtmp://a.rtmp.youtube.com/live2"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />

            <Text style={[styles.label, { color: colors.mutedForeground }]}>Stream Key</Text>
            <View style={[styles.keyRow, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <TextInput
                style={[styles.keyInput, { color: colors.foreground }]}
                value={streamKey}
                onChangeText={setStreamKey}
                placeholder="xxxx-xxxx-xxxx-xxxx-xxxx"
                placeholderTextColor={colors.mutedForeground}
                secureTextEntry={!showKey}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setShowKey((v) => !v)} hitSlop={10}>
                <Feather name={showKey ? "eye-off" : "eye"} size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <View style={[styles.infoBox, { backgroundColor: "rgba(255,59,48,0.12)", borderColor: "rgba(255,59,48,0.3)" }]}>
              <Feather name="info" size={14} color="#FF3B30" />
              <Text style={styles.infoText}>
                Find your Stream Key in YouTube Studio → Go live → Stream
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: "#FF3B30" }]}
              onPress={handleSave}
              activeOpacity={0.8}
            >
              <Text style={styles.saveBtnText}>Save Configuration</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  sheetWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignSelf: "center",
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  label: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  keyRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  keyInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 16,
  },
  infoText: {
    flex: 1,
    color: "#FF3B30",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  saveBtn: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 24,
    marginBottom: 8,
  },
  saveBtnText: {
    color: "#ffffff",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
});
