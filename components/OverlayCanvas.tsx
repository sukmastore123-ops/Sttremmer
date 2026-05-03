import React, { useRef } from "react";
import {
  Image,
  PanResponder,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useStream } from "@/contexts/StreamContext";
import { hexToRgba } from "@/utils/color";
import { RunningText } from "./RunningText";

// Minimum pixels of movement before drag activates.
// Prevents accidental drag on tap or start of vertical scroll.
const DRAG_THRESHOLD = 10;

function DraggableItem({
  position,
  onMove,
  children,
}: {
  position: { x: number; y: number };
  onMove: (pos: { x: number; y: number }) => void;
  children: React.ReactNode;
}) {
  const posRef = useRef(position);
  posRef.current = position;
  // Stores element position adjusted for pre-threshold accumulated displacement,
  // so the element doesn't jump when drag activates after threshold is crossed.
  const baseRef = useRef({ x: 0, y: 0 });

  const panResponder = useRef(
    PanResponder.create({
      // Do NOT capture on initial touch — lets taps and scroll gestures pass through freely.
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,

      // Only activate drag after the finger has moved at least DRAG_THRESHOLD pixels.
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > DRAG_THRESHOLD || Math.abs(gs.dy) > DRAG_THRESHOLD,
      onMoveShouldSetPanResponderCapture: (_, gs) =>
        Math.abs(gs.dx) > DRAG_THRESHOLD || Math.abs(gs.dy) > DRAG_THRESHOLD,

      onPanResponderGrant: (_, gs) => {
        // Subtract accumulated dx/dy so position is continuous from the real finger start.
        baseRef.current = {
          x: posRef.current.x - gs.dx,
          y: posRef.current.y - gs.dy,
        };
      },
      onPanResponderMove: (_, gs) => {
        onMove({
          x: Math.max(0, baseRef.current.x + gs.dx),
          y: Math.max(0, baseRef.current.y + gs.dy),
        });
      },
      onPanResponderTerminationRequest: () => true,
    })
  ).current;

  return (
    <View
      style={[styles.draggable, { left: position.x, top: position.y }]}
      {...panResponder.panHandlers}
    >
      {children}
    </View>
  );
}

const TICKER_H = 42;
const SIDEBAR_W = 90;

export function OverlayCanvas() {
  const { overlay, setOverlay } = useStream();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  // In landscape: sidebar is on the right, ticker can sit flush to bottom.
  // In portrait: bottom bar is ~110px tall, ticker floats above it.
  const tickerBottom = isLandscape ? 0 : 110;
  const tickerRight = isLandscape ? SIDEBAR_W : 0;

  const titleBg = hexToRgba(overlay.titleBgColor, overlay.titleBgOpacity);
  const tickerBg = hexToRgba(overlay.tickerBgColor, overlay.tickerBgOpacity);

  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: "box-none" }]}>
      {overlay.logos.map((logo, i) => (
        <DraggableItem
          key={logo.id}
          position={logo.position}
          onMove={(pos) => {
            const updated = [...overlay.logos];
            updated[i] = { ...updated[i], position: pos };
            setOverlay({ logos: updated });
          }}
        >
          <Image
            source={{ uri: logo.uri }}
            style={[styles.logo, { width: logo.size, height: logo.size }]}
            resizeMode="contain"
          />
        </DraggableItem>
      ))}

      {overlay.titleEnabled && overlay.titleText.trim() !== "" && (
        <DraggableItem
          position={overlay.titlePosition}
          onMove={(pos) => setOverlay({ titlePosition: pos })}
        >
          <View
            style={[
              styles.titleContainer,
              { backgroundColor: titleBg },
            ]}
          >
            <View
              style={[
                styles.titleAccentBar,
                { backgroundColor: overlay.titleTextColor },
              ]}
            />
            <View style={styles.titleTextGroup}>
              <Text
                style={[
                  styles.titleText,
                  {
                    color: overlay.titleTextColor,
                    fontSize: overlay.titleFontSize,
                  },
                ]}
              >
                {overlay.titleText}
              </Text>
              {overlay.subtitleText.trim() !== "" && (
                <Text
                  style={[
                    styles.subtitleText,
                    {
                      color: overlay.subtitleTextColor,
                      fontSize: overlay.subtitleFontSize,
                    },
                  ]}
                >
                  {overlay.subtitleText}
                </Text>
              )}
            </View>
          </View>
        </DraggableItem>
      )}

      {overlay.runningTextEnabled && (() => {
        const validItems = overlay.tickerItems?.filter((item) => item.content.trim()) ?? [];
        return validItems.length > 0 ? (
          <View style={[styles.tickerBar, { backgroundColor: tickerBg, bottom: tickerBottom, right: tickerRight }]}>
            <View style={styles.tickerTrack}>
              <RunningText
                items={validItems}
                speed={overlay.tickerSpeed}
                textColor={overlay.tickerTextColor}
              />
            </View>
          </View>
        ) : null;
      })()}
    </View>
  );
}

const styles = StyleSheet.create({
  draggable: {
    position: "absolute",
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "stretch",
    borderRadius: 6,
    overflow: "hidden",
  },
  titleAccentBar: {
    width: 3,
    alignSelf: "stretch",
    opacity: 0.9,
  },
  titleTextGroup: {
    flexDirection: "column",
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 2,
  },
  titleText: {
    fontFamily: "Inter_700Bold",
  },
  subtitleText: {
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.3,
  },
  tickerBar: {
    position: "absolute",
    left: 0,
    height: 42,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  tickerTrack: {
    flex: 1,
    height: "100%",
    overflow: "hidden",
    position: "relative",
  },
});
