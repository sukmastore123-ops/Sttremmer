import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ConfigSheet } from "@/components/ConfigSheet";
import { LiveIndicator } from "@/components/LiveIndicator";
import { LogoSheet } from "@/components/LogoSheet";
import { OverlayCanvas } from "@/components/OverlayCanvas";
import { TickerSheet } from "@/components/TickerSheet";
import { TitleSheet } from "@/components/TitleSheet";
import { useStream } from "@/contexts/StreamContext";

const IS_WEB = Platform.OS === "web";

const RTMPPublisher = IS_WEB
  ? null
  : (require("react-native-rtmp-publisher").RTMPPublisher as React.ComponentType<any>);

export default function MainScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [showConfig, setShowConfig] = useState(false);
  const [showLogo, setShowLogo] = useState(false);
  const [showTitle, setShowTitle] = useState(false);
  const [showTicker, setShowTicker] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(false);

  const publisherRef = useRef<any>(null);

  const {
    status,
    streamDuration,
    cameraFacing,
    toggleCamera,
    startStream,
    stopStream,
    updateStatus,
    config,
  } = useStream();

  const isLive = status === "live";
  const isConnecting = status === "connecting";
  const isDisconnecting = status === "disconnecting";
  const isBusy = isConnecting || isDisconnecting;

  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const SIDEBAR_W = 90;

  const topPad = IS_WEB ? 67 : insets.top;
  const bottomPad = IS_WEB ? 34 : insets.bottom;

  useEffect(() => {
    if (Platform.OS !== "android") {
      setPermissionsGranted(true);
      return;
    }
    PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.CAMERA,
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    ]).then((result) => {
      const granted =
        result["android.permission.CAMERA"] === "granted" &&
        result["android.permission.RECORD_AUDIO"] === "granted";
      setPermissionsGranted(granted);
    });
  }, []);

  useEffect(() => {
    if (IS_WEB) return;
    if (isLive || isConnecting) {
      activateKeepAwakeAsync();
    } else {
      deactivateKeepAwake();
    }
    return () => {
      deactivateKeepAwake();
    };
  }, [isLive, isConnecting]);

  useEffect(() => {
    if (!isConnecting) return;
    const failTimeout = setTimeout(() => {
      if (!IS_WEB) publisherRef.current?.stopStream();
      updateStatus("idle");
    }, 15000);
    return () => clearTimeout(failTimeout);
  }, [isConnecting, updateStatus]);

  useEffect(() => {
    if (!isDisconnecting) return;
    const t = setTimeout(() => {
      updateStatus("idle");
    }, 4000);
    return () => clearTimeout(t);
  }, [isDisconnecting, updateStatus]);

  const handleConnectionStarted = useCallback(() => {
    updateStatus("connecting");
  }, [updateStatus]);

  const handleConnectionSuccessful = useCallback(() => {
    updateStatus("live");
  }, [updateStatus]);

  const handleConnectionFailed = useCallback(() => {
    updateStatus("idle");
  }, [updateStatus]);

  const handleDisconnect = useCallback(() => {
    updateStatus("idle");
  }, [updateStatus]);

  const handleStreamToggle = () => {
    if (isLive || isBusy) {
      if (!IS_WEB) publisherRef.current?.stopStream();
      stopStream();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else {
      if (!config.streamKey.trim()) {
        setShowConfig(true);
        return;
      }
      startStream();
      if (!IS_WEB) publisherRef.current?.startStream();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  };

  const handleToggleCamera = () => {
    if (!IS_WEB) publisherRef.current?.switchCamera();
    toggleCamera();
  };

  if (IS_WEB) {
    return (
      <View style={styles.container}>
        <View style={[StyleSheet.absoluteFill, styles.webCamBg]}>
          <Feather name="camera-off" size={40} color="rgba(255,255,255,0.15)" />
          <Text style={styles.webCamText}>Preview kamera di perangkat</Text>
        </View>
        <OverlayCanvas />
        <View style={[styles.topBar, { paddingTop: topPad + 10 }]}>
          <View style={styles.topLeft}>
            {isLive ? (
              <LiveIndicator duration={streamDuration} />
            ) : (
              <View style={styles.brandPill}>
                <Feather name="radio" size={14} color="#FF3B30" />
                <Text style={styles.brandText}>RTMP Streamer</Text>
              </View>
            )}
          </View>
          <View style={styles.topRight}>
            <TouchableOpacity style={styles.circleBtn} onPress={() => setShowLogo(true)}>
              <Feather name="image" size={18} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.circleBtn} onPress={() => setShowTitle(true)}>
              <Feather name="type" size={18} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.circleBtn} onPress={() => setShowTicker(true)}>
              <Feather name="align-left" size={18} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.circleBtn} onPress={() => router.push("/settings")}>
              <Feather name="sliders" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {(isConnecting || isDisconnecting) && (
          <View style={styles.statusOverlay}>
            <ActivityIndicator color="#FF3B30" size="small" />
            <Text style={styles.statusText}>
              {isConnecting ? "Menghubungkan ke server..." : "Mengakhiri stream..."}
            </Text>
          </View>
        )}

        <View style={[styles.bottomBar, { paddingBottom: bottomPad + 12 }]}>
          <TouchableOpacity
            style={[styles.sideBtn, isLive && { opacity: 0.4 }]}
            onPress={handleToggleCamera}
            disabled={isLive}
            activeOpacity={0.7}
          >
            <View style={styles.sideBtnCircle}>
              <Feather name="refresh-cw" size={20} color="#fff" />
            </View>
            <Text style={styles.sideBtnLabel}>Balik</Text>
          </TouchableOpacity>

          <Pressable
            style={({ pressed }) => [
              styles.streamBtn,
              isLive && styles.streamBtnStop,
              isBusy && styles.streamBtnBusy,
              pressed && { opacity: 0.85 },
            ]}
            onPress={handleStreamToggle}
            disabled={isBusy}
          >
            {isBusy ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : isLive ? (
              <View style={styles.stopSquare} />
            ) : (
              <View style={styles.liveDot} />
            )}
            <Text style={styles.streamLabel}>
              {isBusy ? "..." : isLive ? "STOP" : "LIVE"}
            </Text>
          </Pressable>

          <TouchableOpacity
            style={styles.sideBtn}
            onPress={() => setShowConfig(true)}
            activeOpacity={0.7}
          >
            <View style={styles.sideBtnCircle}>
              <Feather name="settings" size={20} color="#fff" />
            </View>
            <Text style={styles.sideBtnLabel}>Atur</Text>
          </TouchableOpacity>
        </View>

        <ConfigSheet visible={showConfig} onClose={() => setShowConfig(false)} />
        <LogoSheet visible={showLogo} onClose={() => setShowLogo(false)} />
        <TitleSheet visible={showTitle} onClose={() => setShowTitle(false)} />
        <TickerSheet visible={showTicker} onClose={() => setShowTicker(false)} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {RTMPPublisher && permissionsGranted && (
        <RTMPPublisher
          style={StyleSheet.absoluteFill}
          ref={publisherRef}
          streamURL={config.rtmpUrl.trim().replace(/\/$/, "")}
          streamName={config.streamKey.trim()}
          onConnectionStarted={handleConnectionStarted}
          onConnectionSuccessful={handleConnectionSuccessful}
          onConnectionFailed={handleConnectionFailed}
          onConnectionClosed={handleDisconnect}
          onDisconnect={handleDisconnect}
        />
      )}
      {!IS_WEB && !permissionsGranted && (
        <View style={styles.permissionOverlay}>
          <Feather name="camera-off" size={36} color="rgba(255,255,255,0.4)" />
          <Text style={styles.permissionText}>Izin kamera & mikrofon dibutuhkan</Text>
        </View>
      )}

      <OverlayCanvas />

      <View
        style={[
          styles.topBar,
          {
            paddingTop: topPad + 10,
            paddingRight: isLandscape ? SIDEBAR_W + insets.right + 14 : 14,
          },
        ]}
      >
        <View style={styles.topLeft}>
          {isLive ? (
            <LiveIndicator duration={streamDuration} />
          ) : (
            <View style={styles.brandPill}>
              <Feather name="radio" size={14} color="#FF3B30" />
              <Text style={styles.brandText}>RTMP Streamer</Text>
            </View>
          )}
        </View>

        <View style={styles.topRight}>
          <TouchableOpacity style={styles.circleBtn} onPress={() => setShowLogo(true)}>
            <Feather name="image" size={18} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.circleBtn} onPress={() => setShowTitle(true)}>
            <Feather name="type" size={18} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.circleBtn} onPress={() => setShowTicker(true)}>
            <Feather name="align-left" size={18} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.circleBtn} onPress={() => router.push("/settings")}>
            <Feather name="sliders" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {(isConnecting || isDisconnecting) && (
        <View style={styles.statusOverlay}>
          <ActivityIndicator color="#FF3B30" size="small" />
          <Text style={styles.statusText}>
            {isConnecting ? "Menghubungkan ke server..." : "Mengakhiri stream..."}
          </Text>
        </View>
      )}

      {isLandscape ? (
        <View
          style={[
            styles.sidebarRight,
            {
              paddingTop: insets.top + 12,
              paddingBottom: insets.bottom + 12,
              paddingRight: insets.right + 8,
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.sideBtn, isLive && { opacity: 0.4 }]}
            onPress={handleToggleCamera}
            disabled={isLive}
            activeOpacity={0.7}
          >
            <View style={styles.sideBtnCircle}>
              <Feather name="refresh-cw" size={20} color="#fff" />
            </View>
            <Text style={styles.sideBtnLabel}>Balik</Text>
          </TouchableOpacity>

          <Pressable
            style={({ pressed }) => [
              styles.streamBtn,
              isLive && styles.streamBtnStop,
              isBusy && styles.streamBtnBusy,
              pressed && { opacity: 0.85 },
            ]}
            onPress={handleStreamToggle}
            disabled={isBusy}
          >
            {isBusy ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : isLive ? (
              <View style={styles.stopSquare} />
            ) : (
              <View style={styles.liveDot} />
            )}
            <Text style={styles.streamLabel}>
              {isBusy ? "..." : isLive ? "STOP" : "LIVE"}
            </Text>
          </Pressable>

          <TouchableOpacity
            style={styles.sideBtn}
            onPress={() => setShowConfig(true)}
            activeOpacity={0.7}
          >
            <View style={styles.sideBtnCircle}>
              <Feather name="settings" size={20} color="#fff" />
            </View>
            <Text style={styles.sideBtnLabel}>Atur</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[styles.bottomBar, { paddingBottom: bottomPad + 12 }]}>
          <TouchableOpacity
            style={[styles.sideBtn, isLive && { opacity: 0.4 }]}
            onPress={handleToggleCamera}
            disabled={isLive}
            activeOpacity={0.7}
          >
            <View style={styles.sideBtnCircle}>
              <Feather name="refresh-cw" size={20} color="#fff" />
            </View>
            <Text style={styles.sideBtnLabel}>Balik</Text>
          </TouchableOpacity>

          <Pressable
            style={({ pressed }) => [
              styles.streamBtn,
              isLive && styles.streamBtnStop,
              isBusy && styles.streamBtnBusy,
              pressed && { opacity: 0.85 },
            ]}
            onPress={handleStreamToggle}
            disabled={isBusy}
          >
            {isBusy ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : isLive ? (
              <View style={styles.stopSquare} />
            ) : (
              <View style={styles.liveDot} />
            )}
            <Text style={styles.streamLabel}>
              {isBusy ? "..." : isLive ? "STOP" : "LIVE"}
            </Text>
          </Pressable>

          <TouchableOpacity
            style={styles.sideBtn}
            onPress={() => setShowConfig(true)}
            activeOpacity={0.7}
          >
            <View style={styles.sideBtnCircle}>
              <Feather name="settings" size={20} color="#fff" />
            </View>
            <Text style={styles.sideBtnLabel}>Atur</Text>
          </TouchableOpacity>
        </View>
      )}

      <ConfigSheet visible={showConfig} onClose={() => setShowConfig(false)} />
      <LogoSheet visible={showLogo} onClose={() => setShowLogo(false)} />
      <TitleSheet visible={showTitle} onClose={() => setShowTitle(false)} />
      <TickerSheet visible={showTicker} onClose={() => setShowTicker(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  webCamBg: {
    backgroundColor: "#0d0d0d",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  webCamText: {
    color: "rgba(255,255,255,0.2)",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 14,
    paddingBottom: 20,
  },
  topLeft: { flex: 1 },
  topRight: { flexDirection: "row", gap: 8 },
  brandPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    alignSelf: "flex-start",
  },
  brandText: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  statusOverlay: {
    position: "absolute",
    alignSelf: "center",
    top: "48%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(0,0,0,0.8)",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  statusText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingTop: 18,
    paddingHorizontal: 20,
    backgroundColor: "rgba(0,0,0,0.72)",
  },
  sidebarRight: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    width: 90,
    flexDirection: "column",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.72)",
  },
  sideBtn: { alignItems: "center", gap: 5, width: 64 },
  sideBtnCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  sideBtnLabel: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  streamBtn: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#FF3B30",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    elevation: 6,
  },
  streamBtnStop: {
    backgroundColor: "#1c1c1e",
    borderWidth: 3,
    borderColor: "#FF3B30",
  },
  streamBtnBusy: { backgroundColor: "#444" },
  liveDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#fff",
  },
  stopSquare: {
    width: 22,
    height: 22,
    borderRadius: 5,
    backgroundColor: "#FF3B30",
  },
  streamLabel: {
    color: "#fff",
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.2,
  },
  permissionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0d0d0d",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  permissionText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
});
