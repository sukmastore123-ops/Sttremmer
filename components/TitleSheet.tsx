import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useStream, type TitlePreset } from "@/contexts/StreamContext";
import { ColorPicker } from "./ColorPicker";
import { StyleSlider } from "./StyleSlider";

interface TitleSheetProps {
  visible: boolean;
  onClose: () => void;
}

const TOP_Y = 110;
const TICKER_H = 42;
const SIDEBAR_W = 90;

type PositionPreset = "tl" | "tc" | "tr" | "bl" | "bc" | "br";

const PRESET_GRID: { key: PositionPreset; row: number; col: number }[] = [
  { key: "tl", row: 0, col: 0 },
  { key: "tc", row: 0, col: 1 },
  { key: "tr", row: 0, col: 2 },
  { key: "bl", row: 1, col: 0 },
  { key: "bc", row: 1, col: 1 },
  { key: "br", row: 1, col: 2 },
];

const PRESET_LABELS: Record<PositionPreset, string> = {
  tl: "Kiri\nAtas",
  tc: "Tengah\nAtas",
  tr: "Kanan\nAtas",
  bl: "Kiri\nBawah",
  bc: "Tengah\nBawah",
  br: "Kanan\nBawah",
};

function computePosition(
  preset: PositionPreset,
  elWidth: number,
  elHeight: number,
  screenW: number,
  screenH: number,
  isLandscape: boolean
): { x: number; y: number } {
  const sideW = isLandscape ? SIDEBAR_W : 0;
  const tickerBottom = isLandscape ? 0 : 110;
  const tickerTop = screenH - tickerBottom - TICKER_H;

  const leftX = 16;
  const centerX = Math.max(16, screenW / 2 - elWidth / 2);
  const rightX = Math.max(16, screenW - elWidth - sideW - 16);
  const bottomY = tickerTop - elHeight - 8;

  const xMap = { l: leftX, c: centerX, r: rightX };
  const yMap = { t: TOP_Y, b: bottomY };

  const xKey = preset[1] as "l" | "c" | "r";
  const yKey = preset[0] as "t" | "b";

  return { x: xMap[xKey], y: yMap[yKey] };
}

function PositionGrid({
  onSelect,
  elWidth,
  elHeight,
  screenW,
  screenH,
  isLandscape,
}: {
  onSelect: (pos: { x: number; y: number }) => void;
  elWidth: number;
  elHeight: number;
  screenW: number;
  screenH: number;
  isLandscape: boolean;
}) {
  const [active, setActive] = useState<PositionPreset | null>(null);

  const handlePress = (key: PositionPreset) => {
    setActive(key);
    onSelect(computePosition(key, elWidth, elHeight, screenW, screenH, isLandscape));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const rows = [
    PRESET_GRID.filter((p) => p.row === 0),
    PRESET_GRID.filter((p) => p.row === 1),
  ];

  return (
    <View style={pgStyles.wrapper}>
      <Text style={pgStyles.label}>Posisi Cepat</Text>
      <View style={pgStyles.grid}>
        {rows.map((row, ri) => (
          <View key={ri} style={pgStyles.row}>
            {row.map(({ key }) => {
              const isActive = active === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[pgStyles.cell, isActive && pgStyles.cellActive]}
                  onPress={() => handlePress(key)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[pgStyles.cellText, isActive && pgStyles.cellTextActive]}
                    numberOfLines={2}
                  >
                    {PRESET_LABELS[key]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
      <Text style={pgStyles.hint}>
        Setelah memilih posisi, geser langsung di layar untuk menyesuaikan
      </Text>
    </View>
  );
}

const pgStyles = StyleSheet.create({
  wrapper: { gap: 8 },
  label: {
    color: "#8e8e93",
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  grid: { gap: 6 },
  row: {
    flexDirection: "row",
    gap: 6,
  },
  cell: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  cellActive: {
    borderColor: "#FF3B30",
    backgroundColor: "rgba(255,59,48,0.12)",
  },
  cellText: {
    color: "#8e8e93",
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
    lineHeight: 15,
  },
  cellTextActive: {
    color: "#FF3B30",
    fontFamily: "Inter_600SemiBold",
  },
  hint: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
  },
});

function SectionDivider() {
  return <View style={styles.divider} />;
}

function hexComponents(hex: string): string {
  const safe = hex.replace("#", "");
  if (safe.length !== 6) return "0,0,0";
  const r = parseInt(safe.slice(0, 2), 16);
  const g = parseInt(safe.slice(2, 4), 16);
  const b = parseInt(safe.slice(4, 6), 16);
  return `${r},${g},${b}`;
}

export function TitleSheet({ visible, onClose }: TitleSheetProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width: screenW, height: screenH } = useWindowDimensions();
  const isLandscape = screenW > screenH;
  const { overlay, setOverlay } = useStream();

  const [styleOpen, setStyleOpen] = useState(false);
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [savePresetName, setSavePresetName] = useState("");

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View
        style={[
          styles.sheet,
          { backgroundColor: colors.card, paddingBottom: insets.bottom + 16 },
        ]}
      >
        <View style={styles.handle} />
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIcon}>
              <Feather name="type" size={16} color="#FF3B30" />
            </View>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              Judul / Caption
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Switch
              value={overlay.titleEnabled}
              onValueChange={(v) => setOverlay({ titleEnabled: v })}
              trackColor={{ false: colors.border, true: "#FF3B30" }}
              thumbColor="#ffffff"
            />
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Feather name="x" size={22} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 8 }}
        >
          {/* ── PRESET TERSIMPAN ── */}
          {overlay.titlePresets.length > 0 && (
            <View style={[styles.section, { borderColor: colors.border }]}>
              <TouchableOpacity
                style={styles.collapseBtn}
                onPress={() => {
                  setPresetsOpen((v) => !v);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                activeOpacity={0.7}
              >
                <Feather name="bookmark" size={13} color="#FF3B30" style={{ marginRight: 5 }} />
                <Text style={styles.collapseBtnText}>
                  Preset Tersimpan ({overlay.titlePresets.length})
                </Text>
                <Feather name={presetsOpen ? "chevron-up" : "chevron-down"} size={14} color="#FF3B30" />
              </TouchableOpacity>

              {presetsOpen && (
                <View style={styles.presetList}>
                  {overlay.titlePresets.map((preset: TitlePreset) => (
                    <View key={preset.id} style={[styles.presetItem, { borderColor: colors.border, backgroundColor: colors.muted }]}>
                      <View style={styles.presetInfo}>
                        <Text style={[styles.presetName, { color: colors.foreground }]} numberOfLines={1}>
                          {preset.name}
                        </Text>
                        {preset.subtitleText.trim() !== "" && (
                          <Text style={[styles.presetSub, { color: colors.mutedForeground }]} numberOfLines={1}>
                            {preset.subtitleText}
                          </Text>
                        )}
                      </View>
                      <TouchableOpacity
                        style={[styles.presetActionBtn, { borderColor: colors.border }]}
                        onPress={() => {
                          setOverlay({ titleText: preset.titleText, subtitleText: preset.subtitleText });
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        }}
                      >
                        <Feather name="download" size={14} color="#FF3B30" />
                        <Text style={styles.presetActionText}>Pakai</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.presetDeleteBtn, { borderColor: "#FF3B30" }]}
                        onPress={() => {
                          const updated = overlay.titlePresets.filter((p: TitlePreset) => p.id !== preset.id);
                          setOverlay({ titlePresets: updated });
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }}
                      >
                        <Feather name="trash-2" size={14} color="#FF3B30" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          <View style={[styles.section, { borderColor: colors.border }]}>
            <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
              Teks statis · bisa digeser
            </Text>

            {/* Main Title */}
            <View style={styles.fieldLabel}>
              <Feather name="type" size={12} color="#FF3B30" />
              <Text style={[styles.fieldLabelText, { color: colors.mutedForeground }]}>Main Title</Text>
            </View>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.muted,
                  color: overlay.titleEnabled ? colors.foreground : colors.mutedForeground,
                  borderColor: colors.border,
                },
              ]}
              value={overlay.titleText}
              onChangeText={(t) => setOverlay({ titleText: t })}
              placeholder="Nama narasumber..."
              placeholderTextColor={colors.mutedForeground}
              maxLength={60}
              editable={overlay.titleEnabled}
            />

            <StyleSlider
              label="Ukuran Main Title"
              value={overlay.titleFontSize}
              min={12}
              max={48}
              step={2}
              unit="px"
              onValueChange={(v) => {
                const maxSub = Math.floor(v / 2);
                const updates: Parameters<typeof setOverlay>[0] = { titleFontSize: v };
                if (overlay.subtitleFontSize > maxSub) {
                  updates.subtitleFontSize = Math.max(8, maxSub);
                }
                setOverlay(updates);
              }}
            />

            <SectionDivider />

            {/* Subtitle */}
            <View style={styles.fieldLabel}>
              <Feather name="minus" size={12} color="#FF3B30" />
              <Text style={[styles.fieldLabelText, { color: colors.mutedForeground }]}>Subtitle</Text>
              <Text style={[styles.fieldHint, { color: colors.mutedForeground }]}>
                maks. 50% ukuran title
              </Text>
            </View>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.muted,
                  color: overlay.titleEnabled ? colors.foreground : colors.mutedForeground,
                  borderColor: colors.border,
                },
              ]}
              value={overlay.subtitleText}
              onChangeText={(t) => setOverlay({ subtitleText: t })}
              placeholder="Jabatan / topik..."
              placeholderTextColor={colors.mutedForeground}
              maxLength={80}
              editable={overlay.titleEnabled}
            />

            <StyleSlider
              label="Ukuran Subtitle"
              value={overlay.subtitleFontSize}
              min={8}
              max={Math.floor(overlay.titleFontSize / 2)}
              step={1}
              unit="px"
              onValueChange={(v) => setOverlay({ subtitleFontSize: v })}
            />

            <SectionDivider />

            {/* ── SIMPAN PRESET ── */}
            {!showSaveInput ? (
              <TouchableOpacity
                style={[styles.savePresetBtn, { borderColor: "#FF3B30" }]}
                onPress={() => {
                  setSavePresetName(overlay.titleText || "");
                  setShowSaveInput(true);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                activeOpacity={0.7}
              >
                <Feather name="bookmark" size={15} color="#FF3B30" />
                <Text style={styles.savePresetBtnText}>Simpan sebagai Preset</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.savePresetRow}>
                <TextInput
                  style={[
                    styles.savePresetInput,
                    { backgroundColor: colors.muted, color: colors.foreground, borderColor: "#FF3B30" },
                  ]}
                  value={savePresetName}
                  onChangeText={setSavePresetName}
                  placeholder="Nama preset..."
                  placeholderTextColor={colors.mutedForeground}
                  maxLength={40}
                  autoFocus
                  returnKeyType="done"
                />
                <TouchableOpacity
                  style={styles.saveConfirmBtn}
                  onPress={() => {
                    const name = savePresetName.trim() || overlay.titleText || "Preset";
                    const newPreset: TitlePreset = {
                      id: Date.now().toString(),
                      name,
                      titleText: overlay.titleText,
                      subtitleText: overlay.subtitleText,
                    };
                    setOverlay({ titlePresets: [...overlay.titlePresets, newPreset] });
                    setShowSaveInput(false);
                    setSavePresetName("");
                    setPresetsOpen(true);
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  }}
                >
                  <Feather name="check" size={18} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveCancelBtn, { borderColor: colors.border }]}
                  onPress={() => { setShowSaveInput(false); setSavePresetName(""); }}
                >
                  <Feather name="x" size={18} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
            )}

            <SectionDivider />

            <PositionGrid
              elWidth={overlay.titleFontSize * Math.max(overlay.titleText.length, 4) * 0.6 + 32}
              elHeight={overlay.titleFontSize + 14}
              onSelect={(pos) => setOverlay({ titlePosition: pos })}
              screenW={screenW}
              screenH={screenH}
              isLandscape={isLandscape}
            />

            <SectionDivider />

            <TouchableOpacity
              style={styles.collapseBtn}
              onPress={() => {
                setStyleOpen((v) => !v);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              activeOpacity={0.7}
            >
              <Feather name="sliders" size={13} color="#FF3B30" style={{ marginRight: 5 }} />
              <Text style={styles.collapseBtnText}>Gaya Teks</Text>
              <Feather name={styleOpen ? "chevron-up" : "chevron-down"} size={14} color="#FF3B30" />
            </TouchableOpacity>

            {styleOpen && (
              <View style={styles.stylePanel}>
                <ColorPicker
                  label="Warna Teks (Main Title)"
                  value={overlay.titleTextColor}
                  onChange={(c) => setOverlay({ titleTextColor: c })}
                />
                <SectionDivider />
                <ColorPicker
                  label="Warna Teks (Subtitle)"
                  value={overlay.subtitleTextColor}
                  onChange={(c) => setOverlay({ subtitleTextColor: c })}
                />
                <SectionDivider />
                <ColorPicker
                  label="Warna Background"
                  value={overlay.titleBgColor}
                  onChange={(c) => setOverlay({ titleBgColor: c })}
                />
                <StyleSlider
                  label="Opacity Background"
                  value={Math.round(overlay.titleBgOpacity * 100)}
                  min={0}
                  max={100}
                  step={5}
                  unit="%"
                  onValueChange={(v) => setOverlay({ titleBgOpacity: v / 100 })}
                />
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Preview Lower Third:</Text>
                  <View
                    style={[
                      styles.titlePreview,
                      {
                        backgroundColor: `rgba(${hexComponents(overlay.titleBgColor)},${overlay.titleBgOpacity})`,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.titleAccent,
                        { backgroundColor: overlay.titleTextColor },
                      ]}
                    />
                    <View style={styles.previewTextGroup}>
                      <Text
                        style={[
                          styles.titlePreviewText,
                          {
                            color: overlay.titleTextColor,
                            fontSize: Math.min(overlay.titleFontSize, 22),
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {overlay.titleText || "LIVE STREAM"}
                      </Text>
                      {overlay.subtitleText.trim() !== "" && (
                        <Text
                          style={[
                            styles.subtitlePreviewText,
                            {
                              color: overlay.subtitleTextColor,
                              fontSize: Math.min(overlay.subtitleFontSize, 12),
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {overlay.subtitleText}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            )}
          </View>

          <View style={[styles.tipBox, { backgroundColor: "rgba(255,59,48,0.08)" }]}>
            <Feather name="move" size={13} color="#FF3B30" />
            <Text style={styles.tipText}>
              Pilih "Posisi Cepat" lalu geser langsung di layar kamera untuk penyesuaian lebih lanjut.
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: "90%",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignSelf: "center",
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(255,59,48,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  section: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    gap: 12,
  },
  sectionSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.07)",
    marginVertical: 2,
  },
  collapseBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    paddingVertical: 4,
  },
  collapseBtnText: {
    color: "#FF3B30",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  stylePanel: {
    gap: 16,
    paddingTop: 4,
  },
  previewRow: {
    gap: 8,
  },
  previewLabel: {
    color: "#8e8e93",
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  fieldLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  fieldLabelText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  fieldHint: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
  },
  titlePreview: {
    flexDirection: "row",
    alignItems: "stretch",
    borderRadius: 6,
    overflow: "hidden",
    alignSelf: "flex-start",
    maxWidth: "100%",
  },
  titleAccent: {
    width: 3,
    alignSelf: "stretch",
    opacity: 0.9,
  },
  previewTextGroup: {
    flexDirection: "column",
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 2,
  },
  titlePreviewText: {
    fontFamily: "Inter_700Bold",
  },
  subtitlePreviewText: {
    fontFamily: "Inter_500Medium",
    opacity: 0.82,
    letterSpacing: 0.3,
  },
  presetList: {
    gap: 8,
  },
  presetItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  presetInfo: {
    flex: 1,
    gap: 2,
  },
  presetName: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  presetSub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  presetActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  presetActionText: {
    color: "#FF3B30",
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  presetDeleteBtn: {
    width: 32,
    height: 32,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  savePresetBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderWidth: 1,
    borderRadius: 10,
    borderStyle: "dashed",
    paddingVertical: 10,
  },
  savePresetBtnText: {
    color: "#FF3B30",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  savePresetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  savePresetInput: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  saveConfirmBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: "#FF3B30",
    alignItems: "center",
    justifyContent: "center",
  },
  saveCancelBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tipBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderRadius: 10,
    padding: 12,
    marginBottom: 4,
  },
  tipText: {
    flex: 1,
    color: "#FF3B30",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
});
