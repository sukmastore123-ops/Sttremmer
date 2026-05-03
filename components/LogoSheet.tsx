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
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useStream, type LogoItem } from "@/contexts/StreamContext";
import { StyleSlider } from "./StyleSlider";

interface LogoSheetProps {
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

export function LogoSheet({ visible, onClose }: LogoSheetProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width: screenW, height: screenH } = useWindowDimensions();
  const isLandscape = screenW > screenH;
  const { overlay, setOverlay } = useStream();

  const [openLogoIndex, setOpenLogoIndex] = useState<number | null>(null);

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
              <Feather name="image" size={16} color="#FF3B30" />
            </View>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              Logo / Icon
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} hitSlop={12}>
            <Feather name="x" size={22} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 8 }}
        >
          <View style={[styles.section, { borderColor: colors.border }]}>
            <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
              {overlay.logos.length > 0
                ? `${overlay.logos.length} logo · bisa digeser`
                : "Maks. 3 logo · PNG · bisa digeser"}
            </Text>

            {overlay.logos.map((logo, index) => (
              <View key={logo.id}>
                {index > 0 && <SectionDivider />}
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

            {overlay.logos.length < 3 && (
              <TouchableOpacity
                style={[
                  styles.addBtn,
                  { borderColor: "#FF3B30", marginTop: overlay.logos.length > 0 ? 4 : 0 },
                ]}
                onPress={addLogo}
                activeOpacity={0.7}
              >
                <Feather name="plus-circle" size={16} color="#FF3B30" />
                <Text style={styles.addBtnText}>Tambah Logo</Text>
              </TouchableOpacity>
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
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.07)",
    marginVertical: 2,
  },
  stylePanel: {
    gap: 16,
    paddingTop: 4,
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
  addBtn: {
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
  addBtnText: {
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
