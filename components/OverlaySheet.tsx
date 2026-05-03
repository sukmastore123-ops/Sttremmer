import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  Image,
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
import { useStream, type LogoItem } from "@/contexts/StreamContext";
import { ColorPicker } from "./ColorPicker";
import { StyleSlider } from "./StyleSlider";

interface OverlaySheetProps {
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
  // In landscape the sidebar is on the right (SIDEBAR_W) and ticker sits at bottom:0
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

function CollapseToggle({
  label,
  open,
  onToggle,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.collapseBtn}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <Feather name="sliders" size={13} color="#FF3B30" style={{ marginRight: 5 }} />
      <Text style={styles.collapseBtnText}>{label}</Text>
      <Feather name={open ? "chevron-up" : "chevron-down"} size={14} color="#FF3B30" />
    </TouchableOpacity>
  );
}

function hexComponents(hex: string): string {
  const safe = hex.replace("#", "");
  if (safe.length !== 6) return "0,0,0";
  const r = parseInt(safe.slice(0, 2), 16);
  const g = parseInt(safe.slice(2, 4), 16);
  const b = parseInt(safe.slice(4, 6), 16);
  return `${r},${g},${b}`;
}

export function OverlaySheet({ visible, onClose }: OverlaySheetProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width: screenW, height: screenH } = useWindowDimensions();
  const isLandscape = screenW > screenH;
  const { overlay, setOverlay } = useStream();

  const [openLogoIndex, setOpenLogoIndex] = useState<number | null>(null);
  const [titleStyleOpen, setTitleStyleOpen] = useState(false);
  const [tickerStyleOpen, setTickerStyleOpen] = useState(false);

  const addLogo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const idx = overlay.logos.length;
      const newLogo: LogoItem = {
        id: Date.now().toString(),
        uri: result.assets[0].uri,
        position: { x: 16 + idx * 96, y: 80 },
        size: 80,
      };
      setOverlay({ logos: [...overlay.logos, newLogo] });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const pickLogoAt = async (index: number) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const updated = [...overlay.logos];
      updated[index] = { ...updated[index], uri: result.assets[0].uri };
      setOverlay({ logos: updated });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const removeLogoAt = (index: number) => {
    const updated = overlay.logos.filter((_, i) => i !== index);
    setOverlay({ logos: updated });
    if (openLogoIndex === index) setOpenLogoIndex(null);
    else if (openLogoIndex !== null && openLogoIndex > index)
      setOpenLogoIndex(openLogoIndex - 1);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View
        style={[
          styles.sheet,
          { backgroundColor: colors.card, paddingBottom: insets.bottom + 16 },
        ]}
      >
        <View style={styles.handle} />
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Overlay Editor
          </Text>
          <TouchableOpacity onPress={onClose} hitSlop={12}>
            <Feather name="x" size={22} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 8 }}
        >
          {/* ── LOGO ── */}
          <View style={[styles.section, { borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  Logo / Icon
                </Text>
                <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
                  {overlay.logos.length > 0
                    ? `${overlay.logos.length} logo · bisa digeser`
                    : "Maks. 3 logo · PNG · bisa digeser"}
                </Text>
              </View>
            </View>

            {overlay.logos.map((logo, index) => (
              <View key={logo.id}>
                {index > 0 && <SectionDivider />}

                {/* Logo row: badge + thumbnail + action buttons */}
                <View style={styles.logoItemRow}>
                  <View style={styles.tickerItemBadge}>
                    <Text style={styles.tickerItemBadgeText}>{index + 1}</Text>
                  </View>
                  <Image
                    source={{ uri: logo.uri }}
                    style={styles.logoItemThumb}
                    resizeMode="contain"
                  />
                  <TouchableOpacity
                    style={[styles.outlineBtn, { borderColor: colors.border, flex: 1 }]}
                    onPress={() => pickLogoAt(index)}
                  >
                    <Feather name="refresh-cw" size={13} color={colors.foreground} />
                    <Text style={[styles.outlineBtnText, { color: colors.foreground }]}>Ganti</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.outlineBtn, { borderColor: "#FF3B30" }]}
                    onPress={() => removeLogoAt(index)}
                  >
                    <Feather name="trash-2" size={13} color="#FF3B30" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setOpenLogoIndex(openLogoIndex === index ? null : index);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    hitSlop={10}
                    style={styles.logoCollapseBtn}
                  >
                    <Feather
                      name={openLogoIndex === index ? "chevron-up" : "chevron-down"}
                      size={18}
                      color="#FF3B30"
                    />
                  </TouchableOpacity>
                </View>

                {/* Collapsible: size + position grid */}
                {openLogoIndex === index && (
                  <View style={[styles.stylePanel, { paddingTop: 8 }]}>
                    <StyleSlider
                      label="Ukuran Logo"
                      value={logo.size}
                      min={40}
                      max={160}
                      step={10}
                      unit="px"
                      onValueChange={(v) => {
                        const updated = [...overlay.logos];
                        updated[index] = { ...updated[index], size: v };
                        setOverlay({ logos: updated });
                      }}
                    />
                    <SectionDivider />
                    <PositionGrid
                      elWidth={logo.size}
                      elHeight={logo.size}
                      onSelect={(pos) => {
                        const updated = [...overlay.logos];
                        updated[index] = { ...updated[index], position: pos };
                        setOverlay({ logos: updated });
                      }}
                      screenW={screenW}
                      screenH={screenH}
                      isLandscape={isLandscape}
                    />
                  </View>
                )}
              </View>
            ))}

            {/* Add logo button (max 3) */}
            {overlay.logos.length < 3 && (
              <TouchableOpacity
                style={[
                  styles.addTickerBtn,
                  { borderColor: "#FF3B30", marginTop: overlay.logos.length > 0 ? 4 : 0 },
                ]}
                onPress={addLogo}
                activeOpacity={0.7}
              >
                <Feather name="plus-circle" size={16} color="#FF3B30" />
                <Text style={styles.addTickerBtnText}>Tambah Logo</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ── TITLE / CAPTION ── */}
          <View style={[styles.section, { borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  Judul / Caption
                </Text>
                <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
                  Teks statis, bisa digeser
                </Text>
              </View>
              <Switch
                value={overlay.titleEnabled}
                onValueChange={(v) => setOverlay({ titleEnabled: v })}
                trackColor={{ false: colors.border, true: "#FF3B30" }}
                thumbColor="#ffffff"
              />
            </View>

            {overlay.titleEnabled && (
              <>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.muted,
                      color: colors.foreground,
                      borderColor: colors.border,
                    },
                  ]}
                  value={overlay.titleText}
                  onChangeText={(t) => setOverlay({ titleText: t })}
                  placeholder="Masukkan teks judul"
                  placeholderTextColor={colors.mutedForeground}
                  maxLength={60}
                />

                <StyleSlider
                  label="Ukuran Teks"
                  value={overlay.titleFontSize}
                  min={12}
                  max={48}
                  step={2}
                  unit="px"
                  onValueChange={(v) => setOverlay({ titleFontSize: v })}
                />

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

                <CollapseToggle
                  label="Gaya Teks"
                  open={titleStyleOpen}
                  onToggle={() => {
                    setTitleStyleOpen((v) => !v);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                />

                {titleStyleOpen && (
                  <View style={styles.stylePanel}>
                    <ColorPicker
                      label="Warna Teks"
                      value={overlay.titleTextColor}
                      onChange={(c) => setOverlay({ titleTextColor: c })}
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
                    {/* Live preview */}
                    <View style={styles.previewRow}>
                      <Text style={styles.previewLabel}>Preview:</Text>
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
                      </View>
                    </View>
                  </View>
                )}
              </>
            )}
          </View>

          {/* ── RUNNING TEXT ── */}
          <View style={[styles.section, { borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  Running Text (Ticker)
                </Text>
                <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
                  {overlay.runningTexts.length} item · berjalan kanan → kiri
                </Text>
              </View>
              <Switch
                value={overlay.runningTextEnabled}
                onValueChange={(v) => setOverlay({ runningTextEnabled: v })}
                trackColor={{ false: colors.border, true: "#FF3B30" }}
                thumbColor="#ffffff"
              />
            </View>

            {overlay.runningTextEnabled && (
              <>
                {/* List of text items */}
                {overlay.runningTexts.map((item, index) => (
                  <View key={index} style={styles.tickerItemRow}>
                    <View style={styles.tickerItemBadge}>
                      <Text style={styles.tickerItemBadgeText}>{index + 1}</Text>
                    </View>
                    <TextInput
                      style={[
                        styles.tickerItemInput,
                        {
                          backgroundColor: colors.muted,
                          color: colors.foreground,
                          borderColor: colors.border,
                        },
                      ]}
                      value={item}
                      onChangeText={(t) => {
                        const updated = [...overlay.runningTexts];
                        updated[index] = t;
                        setOverlay({ runningTexts: updated });
                      }}
                      placeholder={`Teks item ${index + 1}...`}
                      placeholderTextColor={colors.mutedForeground}
                      maxLength={120}
                      returnKeyType="done"
                    />
                    {overlay.runningTexts.length > 1 && (
                      <TouchableOpacity
                        onPress={() => {
                          const updated = overlay.runningTexts.filter((_, i) => i !== index);
                          setOverlay({ runningTexts: updated });
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }}
                        hitSlop={10}
                        style={styles.tickerDeleteBtn}
                      >
                        <Feather name="x-circle" size={18} color="#FF3B30" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}

                {/* Add item button */}
                {overlay.runningTexts.length < 10 && (
                  <TouchableOpacity
                    style={[styles.addTickerBtn, { borderColor: "#FF3B30" }]}
                    onPress={() => {
                      setOverlay({ runningTexts: [...overlay.runningTexts, ""] });
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    activeOpacity={0.7}
                  >
                    <Feather name="plus-circle" size={16} color="#FF3B30" />
                    <Text style={styles.addTickerBtnText}>Tambah Teks</Text>
                  </TouchableOpacity>
                )}

                <SectionDivider />

                <CollapseToggle
                  label="Gaya Ticker"
                  open={tickerStyleOpen}
                  onToggle={() => {
                    setTickerStyleOpen((v) => !v);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                />

                {tickerStyleOpen && (
                  <View style={styles.stylePanel}>
                    <ColorPicker
                      label="Warna Teks Ticker"
                      value={overlay.tickerTextColor}
                      onChange={(c) => setOverlay({ tickerTextColor: c })}
                    />
                    <SectionDivider />
                    <ColorPicker
                      label="Warna Background Bar"
                      value={overlay.tickerBgColor}
                      onChange={(c) => setOverlay({ tickerBgColor: c })}
                    />
                    <StyleSlider
                      label="Opacity Background"
                      value={Math.round(overlay.tickerBgOpacity * 100)}
                      min={0}
                      max={100}
                      step={5}
                      unit="%"
                      onValueChange={(v) => setOverlay({ tickerBgOpacity: v / 100 })}
                    />
                    <SectionDivider />
                    <StyleSlider
                      label="Kecepatan Scroll"
                      value={overlay.tickerSpeed}
                      min={20}
                      max={200}
                      step={10}
                      unit=" px/s"
                      onValueChange={(v) => setOverlay({ tickerSpeed: v })}
                    />
                    {/* Live preview — shows all items joined */}
                    <View style={styles.previewRow}>
                      <Text style={styles.previewLabel}>Preview:</Text>
                      <View
                        style={[
                          styles.tickerPreview,
                          {
                            backgroundColor: `rgba(${hexComponents(overlay.tickerBgColor)},${overlay.tickerBgOpacity})`,
                          },
                        ]}
                      >
                        <View style={styles.tickerBadgePreview}>
                          <Text style={styles.tickerBadgeText}>INFO</Text>
                        </View>
                        <Text
                          style={[styles.tickerText, { color: overlay.tickerTextColor }]}
                          numberOfLines={1}
                        >
                          {overlay.runningTexts.filter((t) => t.trim()).join("   ·   ") || "—"}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </>
            )}
          </View>

          <View style={[styles.tipBox, { backgroundColor: "rgba(255,59,48,0.08)" }]}>
            <Feather name="move" size={13} color="#FF3B30" />
            <Text style={styles.tipText}>
              Pilih "Posisi Cepat" untuk menempatkan elemen, lalu geser langsung di layar kamera untuk penyesuaian lebih lanjut.
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
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  sectionSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  uploadBtn: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 10,
    paddingVertical: 20,
    alignItems: "center",
    gap: 8,
  },
  uploadText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  logoItemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoItemThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
    flexShrink: 0,
  },
  logoCollapseBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  outlineBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  outlineBtnText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
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
  titlePreview: {
    flexDirection: "row",
    alignItems: "center",
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
  titlePreviewText: {
    fontFamily: "Inter_700Bold",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tickerPreview: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 6,
    overflow: "hidden",
    height: 34,
  },
  tickerBadgePreview: {
    backgroundColor: "#FF3B30",
    height: "100%",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  tickerBadgeText: {
    color: "#ffffff",
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
  },
  tickerText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    paddingHorizontal: 8,
    flex: 1,
  },
  tickerItemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tickerItemBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(255,59,48,0.15)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  tickerItemBadgeText: {
    color: "#FF3B30",
    fontSize: 12,
    fontFamily: "Inter_700Bold",
  },
  tickerItemInput: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  tickerDeleteBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  addTickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderWidth: 1,
    borderRadius: 10,
    borderStyle: "dashed",
    paddingVertical: 11,
    marginTop: 2,
  },
  addTickerBtnText: {
    color: "#FF3B30",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
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
