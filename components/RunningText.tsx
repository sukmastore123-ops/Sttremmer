import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  LayoutChangeEvent,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { TickerItem } from "@/contexts/StreamContext";

interface RunningTextProps {
  items: TickerItem[];
  speed?: number;
  textColor?: string;
}

const USE_NATIVE_DRIVER = Platform.OS !== "web";

const LABEL_COLORS: Record<string, string> = {
  INFO: "#FF3B30",
  LAPORAN: "#3B82F6",
  TANGGAL: "#34C759",
  SPONSOR: "#F0C040",
  BERITA: "#FF6B00",
  SPORT: "#A855F7",
};

function getLabelColor(label: string): string {
  return LABEL_COLORS[label.toUpperCase()] ?? "#8e8e93";
}

function getLabelTextColor(label: string): string {
  return label.toUpperCase() === "SPONSOR" ? "#1a1a1a" : "#ffffff";
}

function TickerRow({
  items,
  textColor,
  onLayout,
}: {
  items: TickerItem[];
  textColor: string;
  onLayout?: (e: LayoutChangeEvent) => void;
}) {
  return (
    <View style={styles.tickerRow} onLayout={onLayout}>
      {items.map((item, index) => (
        <React.Fragment key={item.id}>
          <View
            style={[
              styles.labelBadge,
              { backgroundColor: getLabelColor(item.label) },
              index > 0 && styles.labelBadgeGap,
            ]}
          >
            <Text
              style={[styles.labelText, { color: getLabelTextColor(item.label) }]}
              numberOfLines={1}
            >
              {item.label.toUpperCase()}
            </Text>
          </View>
          <Text
            style={[styles.contentText, { color: textColor }]}
            numberOfLines={1}
          >
            {" "}{item.content}{"  "}
          </Text>
        </React.Fragment>
      ))}
    </View>
  );
}

export function RunningText({
  items,
  speed = 80,
  textColor = "#ffffff",
}: RunningTextProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);
  const activeRef = useRef(true);
  const [unitWidth, setUnitWidth] = useState(0);
  const measuredRef = useRef(0);

  const validItems = items.filter((item) => item.content.trim());

  const startAnim = useCallback(
    (width: number) => {
      if (width <= 0) return;
      animRef.current?.stop();
      translateX.setValue(0);
      activeRef.current = true;
      const duration = (width / speed) * 1000;

      const runLoop = () => {
        if (!activeRef.current) return;
        translateX.setValue(0);
        const anim = Animated.timing(translateX, {
          toValue: -width,
          duration,
          useNativeDriver: USE_NATIVE_DRIVER,
          easing: Easing.linear,
        });
        animRef.current = anim;
        anim.start(({ finished }) => {
          if (finished && activeRef.current) runLoop();
        });
      };

      runLoop();
    },
    [speed, translateX]
  );

  const itemsKey = validItems.map((i) => `${i.id}:${i.label}:${i.content}`).join("|");

  useEffect(() => {
    if (unitWidth > 0) startAnim(unitWidth);
    return () => {
      activeRef.current = false;
      animRef.current?.stop();
    };
  }, [unitWidth, speed, itemsKey, startAnim]);

  const onMeasure = (w: number) => {
    // w is the natural width of one full pass — must be > 10 and meaningfully different
    if (w > 10 && Math.abs(w - measuredRef.current) > 2) {
      measuredRef.current = w;
      setUnitWidth(w);
    }
  };

  if (validItems.length === 0) return null;

  return (
    <>
      {/*
        Measurement ghost: the outer View has a huge explicit width (99999) so React Native
        does NOT clamp it to the screen/parent width. The inner TickerRow (flexDirection: row)
        can then grow to its true natural content width, which onLayout reports correctly.
      */}
      <View style={styles.measureOuter} pointerEvents="none">
        <TickerRow
          items={validItems}
          textColor={textColor}
          onLayout={(e) => onMeasure(e.nativeEvent.layout.width)}
        />
      </View>

      {unitWidth > 0 && (
        <Animated.View
          style={[
            styles.container,
            { transform: [{ translateX }], width: unitWidth * 2 },
          ]}
        >
          {/* Two identical copies side-by-side for seamless infinite loop */}
          <View style={[styles.copyWrapper, { width: unitWidth }]}>
            <TickerRow items={validItems} textColor={textColor} />
          </View>
          <View style={[styles.copyWrapper, { width: unitWidth }]}>
            <TickerRow items={validItems} textColor={textColor} />
          </View>
        </Animated.View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  measureOuter: {
    position: "absolute",
    opacity: 0,
    top: -500,
    left: 0,
    // Very large explicit width so the row is NOT clamped to screen/parent width.
    // The TickerRow inside will shrink-fit to its content and report its true width.
    width: 99999,
    flexDirection: "row",
  },
  container: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    flexDirection: "row",
    alignItems: "center",
  },
  copyWrapper: {
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  tickerRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "nowrap",
  },
  labelBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 3,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  labelBadgeGap: {
    marginLeft: 10,
  },
  labelText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.8,
  },
  contentText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    flexShrink: 0,
  },
});
