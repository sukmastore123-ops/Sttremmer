import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { isValidHex } from "@/utils/color";

const PRESETS = [
  "#ffffff",
  "#ffff00",
  "#00e5ff",
  "#30d158",
  "#ff9f0a",
  "#ff3b30",
  "#0a84ff",
  "#000000",
];

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (hex: string) => void;
}

export function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  const [hexInput, setHexInput] = useState(value);

  const handlePreset = (color: string) => {
    setHexInput(color);
    onChange(color);
  };

  const handleHexCommit = () => {
    const raw = hexInput.startsWith("#") ? hexInput : `#${hexInput}`;
    if (isValidHex(raw)) {
      onChange(raw);
      setHexInput(raw);
    } else {
      setHexInput(value);
    }
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.swatches}>
        {PRESETS.map((c) => (
          <TouchableOpacity
            key={c}
            style={[
              styles.swatch,
              { backgroundColor: c },
              c === "#ffffff" && styles.swatchWhite,
              value.toLowerCase() === c.toLowerCase() && styles.swatchSelected,
            ]}
            onPress={() => handlePreset(c)}
            activeOpacity={0.7}
          />
        ))}
      </View>
      <View style={styles.hexRow}>
        <View
          style={[styles.hexPreview, { backgroundColor: isValidHex(hexInput.startsWith("#") ? hexInput : `#${hexInput}`) ? (hexInput.startsWith("#") ? hexInput : `#${hexInput}`) : value }]}
        />
        <TextInput
          style={styles.hexInput}
          value={hexInput}
          onChangeText={setHexInput}
          onBlur={handleHexCommit}
          onSubmitEditing={handleHexCommit}
          placeholder="#ffffff"
          placeholderTextColor="#555"
          autoCapitalize="none"
          maxLength={7}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 10,
  },
  label: {
    color: "#8e8e93",
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  swatches: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  swatch: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  swatchWhite: {
    borderColor: "rgba(255,255,255,0.4)",
  },
  swatchSelected: {
    borderWidth: 2.5,
    borderColor: "#FF3B30",
  },
  hexRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  hexPreview: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  hexInput: {
    flex: 1,
    color: "#ffffff",
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
});
