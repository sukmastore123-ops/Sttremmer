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
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useStream } from "@/contexts/StreamContext";
import type { TickerItem } from "@/contexts/StreamContext";
import { ColorPicker } from "./ColorPicker";
import { StyleSlider } from "./StyleSlider";

interface TickerSheetProps {
  visible: boolean;
  onClose: () => void;
}

const LABEL_PRESETS = [
  { label: "INFO",     color: "#FF3B30" },
  { label: "LAPORAN",  color: "#3B82F6" },
  { label: "TANGGAL",  color: "#34C759" },
  { label: "SPONSOR",  color: "#F0C040" },
  { label: "BERITA", color: "#FF6B00" },
  { label: "SPORT",    color: "#A855F7" },
];

function getLabelColor(label: string): string {
  const found = LABEL_PRESETS.find((p) => p.label === label.toUpperCase());
  return found?.color ?? "#8e8e93";
}

function getLabelTextColor(label: string): string {
  return label.toUpperCase() === "SPONSOR" ? "#1a1a1a" : "#ffffff";
}

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

function uid(): string {
  return `ticker_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

interface ItemCardProps {
  item: TickerItem;
  index: number;
  canDelete: boolean;
  onChange: (updated: TickerItem) => void;
  onDelete: () => void;
  colors: ReturnType<typeof useColors>;
}

function ItemCard({ item, index, canDelete, onChange, onDelete, colors }: ItemCardProps) {
  const [customMode, setCustomMode] = useState(
    !LABEL_PRESETS.some((p) => p.label === item.label.toUpperCase())
  );

  const labelColor = getLabelColor(item.label);
  const labelTextColor = getLabelTextColor(item.label);

  return (
    <View style={[styles.itemCard, { borderColor: colors.border, backgroundColor: colors.muted }]}>
      {/* Card header: number badge + label row + delete */}
      <View style={styles.itemCardHeader}>
        <View style={styles.itemBadge}>
          <Text style={styles.itemBadgeText}>{index + 1}</Text>
        </View>
        <Text style={[styles.itemLabelTitle, { color: colors.mutedForeground }]}>Label</Text>
        {canDelete && (
          <TouchableOpacity
            onPress={() => { onDelete(); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            hitSlop={10}
            style={styles.deleteBtn}
          >
            <Feather name="trash-2" size={15} color="#FF3B30" />
          </TouchableOpacity>
        )}
      </View>

      {/* Preset label chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        {LABEL_PRESETS.map((preset) => {
          const selected = !customMode && item.label.toUpperCase() === preset.label;
          return (
            <TouchableOpacity
              key={preset.label}
              style={[
                styles.chip,
                {
                  backgroundColor: selected ? preset.color : "transparent",
                  borderColor: preset.color,
                },
              ]}
              onPress={() => {
                setCustomMode(false);
                onChange({ ...item, label: preset.label });
                Haptics.selectionAsync();
              }}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: selected ? (preset.label === "SPONSOR" ? "#1a1a1a" : "#fff") : preset.color },
                ]}
              >
                {preset.label}
              </Text>
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity
          style={[
            styles.chip,
            {
              backgroundColor: customMode ? "#8e8e93" : "transparent",
              borderColor: "#8e8e93",
            },
          ]}
          onPress={() => { setCustomMode(true); Haptics.selectionAsync(); }}
          activeOpacity={0.75}
        >
          <Feather name="edit-2" size={11} color={customMode ? "#fff" : "#8e8e93"} />
          <Text style={[styles.chipText, { color: customMode ? "#fff" : "#8e8e93", marginLeft: 4 }]}>
            Custom
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Custom label input (visible only in custom mode) */}
      {customMode && (
        <TextInput
          style={[
            styles.customLabelInput,
            { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border },
          ]}
          value={item.label}
          onChangeText={(t) => onChange({ ...item, label: t.toUpperCase() })}
          placeholder="Ketik label (maks 10 karakter)..."
          placeholderTextColor={colors.mutedForeground}
          maxLength={10}
          autoCapitalize="characters"
          returnKeyType="done"
        />
      )}

      {/* Label preview badge */}
      <View style={styles.labelPreviewRow}>
        <View style={[styles.labelPreviewBadge, { backgroundColor: labelColor }]}>
          <Text style={[styles.labelPreviewText, { color: labelTextColor }]}>
            {item.label || "—"}
          </Text>
        </View>
      </View>

      <SectionDivider />

      {/* Content text input */}
      <Text style={[styles.itemLabelTitle, { color: colors.mutedForeground, marginBottom: 6 }]}>
        Isi Pesan
      </Text>
      <TextInput
        style={[
          styles.contentInput,
          { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border },
        ]}
        value={item.content}
        onChangeText={(t) => onChange({ ...item, content: t })}
        placeholder={`Teks item ${index + 1}...`}
        placeholderTextColor={colors.mutedForeground}
        maxLength={150}
        returnKeyType="done"
        multiline
      />
    </View>
  );
}

export function TickerSheet({ visible, onClose }: TickerSheetProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { overlay, setOverlay } = useStream();

  const [styleOpen, setStyleOpen] = useState(false);

  const items = overlay.tickerItems ?? [];

  const updateItem = (index: number, updated: TickerItem) => {
    const next = [...items];
    next[index] = updated;
    setOverlay({ tickerItems: next });
  };

  const deleteItem = (index: number) => {
    setOverlay({ tickerItems: items.filter((_, i) => i !== index) });
  };

  const addItem = () => {
    if (items.length >= 10) return;
    setOverlay({
      tickerItems: [
        ...items,
        { id: uid(), label: "INFO", content: "" },
      ],
    });
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
              <Feather name="align-left" size={16} color="#FF3B30" />
            </View>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              News Ticker
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Switch
              value={overlay.runningTextEnabled}
              onValueChange={(v) => setOverlay({ runningTextEnabled: v })}
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
          contentContainerStyle={{ paddingBottom: 8, gap: 10 }}
        >
          {/* Ticker items count info */}
          <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
            {items.length} item · scroll kanan → kiri
          </Text>

          {/* Item cards */}
          {items.map((item, index) => (
            <ItemCard
              key={item.id}
              item={item}
              index={index}
              canDelete={items.length > 1}
              onChange={(updated) => updateItem(index, updated)}
              onDelete={() => deleteItem(index)}
              colors={colors}
            />
          ))}

          {/* Add button */}
          {items.length < 10 && (
            <TouchableOpacity
              style={[styles.addBtn, { borderColor: "#FF3B30" }]}
              onPress={addItem}
              activeOpacity={0.7}
            >
              <Feather name="plus-circle" size={16} color="#FF3B30" />
              <Text style={styles.addBtnText}>Tambah Ticker Item</Text>
            </TouchableOpacity>
          )}

          <SectionDivider />

          {/* Gaya Ticker collapsible */}
          <TouchableOpacity
            style={styles.collapseBtn}
            onPress={() => {
              setStyleOpen((v) => !v);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            activeOpacity={0.7}
          >
            <Feather name="sliders" size={13} color="#FF3B30" style={{ marginRight: 5 }} />
            <Text style={styles.collapseBtnText}>Gaya Ticker</Text>
            <Feather name={styleOpen ? "chevron-up" : "chevron-down"} size={14} color="#FF3B30" />
          </TouchableOpacity>

          {styleOpen && (
            <View style={styles.stylePanel}>
              <ColorPicker
                label="Warna Teks Konten"
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

              {/* Preview bar */}
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
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.previewItems}>
                      {items.filter((i) => i.content.trim()).map((item, idx) => (
                        <React.Fragment key={item.id}>
                          <View
                            style={[
                              styles.previewBadge,
                              { backgroundColor: getLabelColor(item.label) },
                            ]}
                          >
                            <Text
                              style={[
                                styles.previewBadgeText,
                                { color: getLabelTextColor(item.label) },
                              ]}
                            >
                              {item.label}
                            </Text>
                          </View>
                          <Text
                            style={[styles.previewContent, { color: overlay.tickerTextColor }]}
                          >
                            {" "}{item.content}
                          </Text>
                        </React.Fragment>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              </View>
            </View>
          )}
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
    maxHeight: "92%",
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
    marginBottom: 16,
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
  sectionSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginBottom: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.07)",
    marginVertical: 4,
  },
  itemCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  itemCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  itemBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,59,48,0.15)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  itemBadgeText: {
    color: "#FF3B30",
    fontSize: 11,
    fontFamily: "Inter_700Bold",
  },
  itemLabelTitle: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    flex: 1,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  deleteBtn: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  chipsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingRight: 4,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  chipText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.6,
  },
  customLabelInput: {
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
  },
  labelPreviewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  labelPreviewBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 4,
  },
  labelPreviewText: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.8,
  },
  contentInput: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    minHeight: 44,
    textAlignVertical: "top",
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
  },
  addBtnText: {
    color: "#FF3B30",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  collapseBtn: {
    flexDirection: "row",
    alignItems: "center",
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
  tickerPreview: {
    borderRadius: 6,
    overflow: "hidden",
    height: 36,
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  previewItems: {
    flexDirection: "row",
    alignItems: "center",
  },
  previewBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  previewBadgeText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.7,
  },
  previewContent: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
});
