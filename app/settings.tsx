import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useStream } from "@/contexts/StreamContext";

const RESOLUTIONS = [
  { label: "720p (HD)", value: "720p" as const, sub: "1280 × 720" },
  { label: "1080p (Full HD)", value: "1080p" as const, sub: "1920 × 1080" },
];

const VIDEO_BITRATES = [
  { label: "1500 kbps", value: 1500 },
  { label: "2500 kbps", value: 2500 },
  { label: "4000 kbps", value: 4000 },
  { label: "6000 kbps", value: 6000 },
];

const AUDIO_BITRATES = [
  { label: "96 kbps", value: 96 },
  { label: "128 kbps", value: 128 },
  { label: "192 kbps", value: 192 },
  { label: "256 kbps", value: 256 },
];

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function OptionRow({
  label,
  sub,
  selected,
  onPress,
}: {
  label: string;
  sub?: string;
  selected: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <TouchableOpacity
      style={[
        styles.optionRow,
        { backgroundColor: colors.card, borderColor: selected ? "#FF3B30" : colors.border },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={{ flex: 1 }}>
        <Text style={[styles.optionLabel, { color: colors.foreground }]}>{label}</Text>
        {sub && <Text style={[styles.optionSub, { color: colors.mutedForeground }]}>{sub}</Text>}
      </View>
      {selected && (
        <View style={styles.checkCircle}>
          <Feather name="check" size={14} color="#ffffff" />
        </View>
      )}
    </TouchableOpacity>
  );
}

function AboutModal({ visible, onClose, colors }: { visible: boolean; onClose: () => void; colors: ReturnType<typeof useColors> }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.aboutBackdrop} onPress={onClose}>
        <Pressable style={[styles.aboutCard, { backgroundColor: colors.card }]} onPress={() => {}}>
          {/* App icon */}
          <View style={styles.aboutIconWrap}>
            <Feather name="radio" size={28} color="#FF3B30" />
          </View>

          <Text style={[styles.aboutAppName, { color: colors.foreground }]}>
            RTMP Live Streamer
          </Text>
          <Text style={[styles.aboutVersion, { color: colors.mutedForeground }]}>
            Versi 1.0.0
          </Text>

          <View style={[styles.aboutDivider, { backgroundColor: colors.border }]} />

          {/* Developer row */}
          <View style={styles.aboutRow}>
            <Text style={[styles.aboutRowLabel, { color: colors.mutedForeground }]}>Developer</Text>
            <Text style={[styles.aboutRowValue, { color: colors.foreground }]}>zainalzxc</Text>
          </View>

          <View style={styles.aboutRow}>
            <Text style={[styles.aboutRowLabel, { color: colors.mutedForeground }]}>Platform</Text>
            <Text style={[styles.aboutRowValue, { color: colors.foreground }]}>Expo / React Native</Text>
          </View>

          <View style={styles.aboutRow}>
            <Text style={[styles.aboutRowLabel, { color: colors.mutedForeground }]}>Protocol</Text>
            <Text style={[styles.aboutRowValue, { color: colors.foreground }]}>RTMP Streaming</Text>
          </View>

          <View style={[styles.aboutDivider, { backgroundColor: colors.border }]} />

          <TouchableOpacity
            style={[styles.aboutCloseBtn, { borderColor: colors.border }]}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={[styles.aboutCloseBtnText, { color: colors.mutedForeground }]}>Tutup</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function SettingsScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { settings, setSettings, config, setConfig } = useStream();
  const [showAbout, setShowAbout] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Stream Settings</Text>
        <TouchableOpacity
          onPress={() => { setShowAbout(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          hitSlop={12}
          style={styles.aboutBtn}
        >
          <Text style={[styles.aboutBtnText, { color: colors.mutedForeground, borderColor: colors.border }]}>?</Text>
        </TouchableOpacity>
      </View>

      <AboutModal visible={showAbout} onClose={() => setShowAbout(false)} colors={colors} />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="youtube" size={20} color="#FF3B30" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.infoCardTitle, { color: colors.foreground }]}>YouTube Streaming</Text>
            <Text style={[styles.infoCardSub, { color: colors.mutedForeground }]}>
              RTMP URL: {config.rtmpUrl || "Not set"}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.editBadge, { backgroundColor: "rgba(255,59,48,0.15)" }]}
          >
            <Text style={styles.editBadgeText}>Edit Key</Text>
          </TouchableOpacity>
        </View>

        <SectionTitle title="RESOLUTION" />
        {RESOLUTIONS.map((r) => (
          <OptionRow
            key={r.value}
            label={r.label}
            sub={r.sub}
            selected={settings.resolution === r.value}
            onPress={() => {
              setSettings({ resolution: r.value });
              Haptics.selectionAsync();
            }}
          />
        ))}

        <SectionTitle title="VIDEO BITRATE" />
        <View style={styles.chipsRow}>
          {VIDEO_BITRATES.map((b) => (
            <TouchableOpacity
              key={b.value}
              style={[
                styles.chip,
                {
                  backgroundColor:
                    settings.videoBitrate === b.value ? "#FF3B30" : colors.card,
                  borderColor:
                    settings.videoBitrate === b.value ? "#FF3B30" : colors.border,
                },
              ]}
              onPress={() => {
                setSettings({ videoBitrate: b.value });
                Haptics.selectionAsync();
              }}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: settings.videoBitrate === b.value ? "#ffffff" : colors.foreground },
                ]}
              >
                {b.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <SectionTitle title="AUDIO BITRATE" />
        <View style={styles.chipsRow}>
          {AUDIO_BITRATES.map((b) => (
            <TouchableOpacity
              key={b.value}
              style={[
                styles.chip,
                {
                  backgroundColor:
                    settings.audioBitrate === b.value ? "#FF3B30" : colors.card,
                  borderColor:
                    settings.audioBitrate === b.value ? "#FF3B30" : colors.border,
                },
              ]}
              onPress={() => {
                setSettings({ audioBitrate: b.value });
                Haptics.selectionAsync();
              }}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: settings.audioBitrate === b.value ? "#ffffff" : colors.foreground },
                ]}
              >
                {b.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <SectionTitle title="STREAM SUMMARY" />
        <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {[
            { icon: "monitor", label: "Resolution", value: settings.resolution === "720p" ? "1280 × 720 (HD)" : "1920 × 1080 (Full HD)" },
            { icon: "film", label: "Video Bitrate", value: `${settings.videoBitrate} kbps` },
            { icon: "mic", label: "Audio Bitrate", value: `${settings.audioBitrate} kbps` },
            { icon: "link", label: "Encoder", value: "H.264 / AAC" },
          ].map((row, i, arr) => (
            <View
              key={row.label}
              style={[styles.summaryRow, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
            >
              <Feather name={row.icon as any} size={16} color="#FF3B30" />
              <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>{row.label}</Text>
              <Text style={[styles.summaryValue, { color: colors.foreground }]}>{row.value}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.noteBox, { backgroundColor: "rgba(34,197,94,0.1)", borderColor: "rgba(34,197,94,0.3)" }]}>
          <Feather name="check-circle" size={15} color="#22c55e" />
          <Text style={[styles.noteText, { color: "#22c55e" }]}>
            RTMP streaming aktif menggunakan NodeMediaClient (H.264/AAC). Pastikan Stream Key sudah diisi sebelum memulai siaran.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 0,
  },
  sectionTitle: {
    color: "#8e8e93",
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    marginTop: 24,
    marginBottom: 10,
    marginLeft: 4,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  optionLabel: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  optionSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FF3B30",
    alignItems: "center",
    justifyContent: "center",
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4,
  },
  chip: {
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chipText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 12,
    marginBottom: 4,
  },
  infoCardTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  infoCardSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  editBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  editBadgeText: {
    color: "#FF3B30",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  summaryCard: {
    borderWidth: 1,
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 4,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  summaryLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  summaryValue: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  noteBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginTop: 20,
  },
  noteText: {
    flex: 1,
    color: "#FF3B30",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },
  aboutBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  aboutBtnText: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
    lineHeight: 23,
    overflow: "hidden",
  },
  aboutBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  aboutCard: {
    width: "100%",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    gap: 4,
    elevation: 10,
  },
  aboutIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: "rgba(255,59,48,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  aboutAppName: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  aboutVersion: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginBottom: 4,
  },
  aboutDivider: {
    width: "100%",
    height: 1,
    marginVertical: 12,
  },
  aboutRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 5,
  },
  aboutRowLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  aboutRowValue: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  aboutCloseBtn: {
    marginTop: 8,
    width: "100%",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  aboutCloseBtnText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
});
