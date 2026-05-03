import React, { useRef, useState } from "react";
import {
  LayoutChangeEvent,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface StyleSliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onValueChange: (v: number) => void;
  label?: string;
  unit?: string;
  trackColor?: string;
}

const THUMB = 22;

export function StyleSlider({
  value,
  min,
  max,
  step = 1,
  onValueChange,
  label,
  unit = "",
  trackColor = "#FF3B30",
}: StyleSliderProps) {
  const [trackW, setTrackW] = useState(0);
  const trackWRef = useRef(0);
  // pageX of the track on screen — measured on every touch to handle ScrollView scrolling
  const trackPageXRef = useRef(0);
  const trackViewRef = useRef<View>(null);

  const handleLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    trackWRef.current = w;
    setTrackW(w);
  };

  const refreshPageX = () => {
    trackViewRef.current?.measure((_x, _y, _w, _h, pageX) => {
      trackPageXRef.current = pageX;
    });
  };

  const computeValue = (localX: number): number => {
    const w = trackWRef.current;
    if (!w) return value;
    const ratio = Math.max(0, Math.min(1, localX / w));
    const raw = min + ratio * (max - min);
    const snapped = Math.round(raw / step) * step;
    return Math.max(min, Math.min(max, snapped));
  };

  const panResponder = useRef(
    PanResponder.create({
      // Capture phase — grabs the touch BEFORE the parent ScrollView can steal it.
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,

      onPanResponderGrant: (e) => {
        // Refresh the track's absolute page position so coordinate conversion is
        // correct even if the ScrollView has been scrolled since last layout.
        refreshPageX();
        // Use pageX (absolute screen coordinates) minus the track's pageX.
        // This is accurate regardless of ScrollView scroll offset or nesting.
        const localX = e.nativeEvent.pageX - trackPageXRef.current;
        onValueChange(computeValue(localX));
      },

      onPanResponderMove: (e) => {
        // Use pageX continuously — no accumulated delta errors.
        const localX = e.nativeEvent.pageX - trackPageXRef.current;
        onValueChange(computeValue(localX));
      },
    })
  ).current;

  const pct = trackW > 0 ? Math.max(0, Math.min(1, (value - min) / (max - min))) : 0;
  const thumbLeft = pct * trackW - THUMB / 2;

  return (
    <View style={styles.wrapper}>
      {label !== undefined && (
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          <Text style={[styles.valueText, { color: trackColor }]}>
            {value}
            {unit}
          </Text>
        </View>
      )}
      <View
        ref={trackViewRef}
        style={styles.trackHitArea}
        onLayout={(e) => {
          handleLayout(e);
          // Measure absolute position right after layout for first use.
          refreshPageX();
        }}
        {...panResponder.panHandlers}
      >
        <View style={styles.track}>
          <View
            style={[
              styles.fill,
              { width: pct * trackW, backgroundColor: trackColor },
            ]}
          />
        </View>
        {trackW > 0 && (
          <View
            style={[
              styles.thumb,
              { left: thumbLeft, backgroundColor: trackColor },
            ]}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    color: "#8e8e93",
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  valueText: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
  },
  trackHitArea: {
    height: 36,
    justifyContent: "center",
    position: "relative",
  },
  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 2,
  },
  thumb: {
    position: "absolute",
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    top: (36 - THUMB) / 2,
    borderWidth: 2.5,
    borderColor: "#ffffff",
    elevation: 3,
  },
});
