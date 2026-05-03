import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

interface StreamConfig {
  rtmpUrl: string;
  streamKey: string;
}

export interface LogoItem {
  id: string;
  uri: string;
  position: { x: number; y: number };
  size: number;
}

export interface TickerItem {
  id: string;
  label: string;
  content: string;
}

export interface TitlePreset {
  id: string;
  name: string;
  titleText: string;
  subtitleText: string;
}

export interface OverlayConfig {
  logos: LogoItem[];

  titleText: string;
  titleEnabled: boolean;
  titlePosition: { x: number; y: number };
  titleTextColor: string;
  titleBgColor: string;
  titleBgOpacity: number;
  titleFontSize: number;
  subtitleText: string;
  subtitleFontSize: number;
  subtitleTextColor: string;
  titlePresets: TitlePreset[];

  tickerItems: TickerItem[];
  runningTextEnabled: boolean;
  tickerTextColor: string;
  tickerBgColor: string;
  tickerBgOpacity: number;
  tickerSpeed: number;
}

interface StreamSettings {
  resolution: "720p" | "1080p";
  videoBitrate: number;
  audioBitrate: number;
}

export type StreamStatus = "idle" | "connecting" | "live" | "disconnecting";

interface StreamContextType {
  config: StreamConfig;
  setConfig: (config: StreamConfig) => void;
  overlay: OverlayConfig;
  setOverlay: (overlay: Partial<OverlayConfig>) => void;
  settings: StreamSettings;
  setSettings: (settings: Partial<StreamSettings>) => void;
  status: StreamStatus;
  streamDuration: number;
  cameraFacing: "front" | "back";
  toggleCamera: () => void;
  startStream: () => void;
  stopStream: () => void;
  updateStatus: (status: StreamStatus) => void;
}

const defaultConfig: StreamConfig = {
  rtmpUrl: "rtmp://a.rtmp.youtube.com/live2",
  streamKey: "",
};

const defaultOverlay: OverlayConfig = {
  logos: [],

  titleText: "LIVE STREAM",
  titleEnabled: true,
  titlePosition: { x: 16, y: 160 },
  titleTextColor: "#ffffff",
  titleBgColor: "#000000",
  titleBgOpacity: 0.55,
  titleFontSize: 24,
  subtitleText: "",
  subtitleFontSize: 12,
  subtitleTextColor: "#f0c040",
  titlePresets: [],

  tickerItems: [
    { id: "default_1", label: "INFO", content: "Selamat datang di live stream!" },
    { id: "default_2", label: "INFO", content: "Nantikan konten menarik selanjutnya..." },
    { id: "default_3", label: "INFO", content: "Jangan lupa like & subscribe!" },
  ],
  runningTextEnabled: true,
  tickerTextColor: "#ffffff",
  tickerBgColor: "#000000",
  tickerBgOpacity: 0.7,
  tickerSpeed: 70,
};

const defaultSettings: StreamSettings = {
  resolution: "720p",
  videoBitrate: 2500,
  audioBitrate: 128,
};

const StreamContext = createContext<StreamContextType | null>(null);

export function StreamProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfigState] = useState<StreamConfig>(defaultConfig);
  const [overlay, setOverlayState] = useState<OverlayConfig>(defaultOverlay);
  const [settings, setSettingsState] = useState<StreamSettings>(defaultSettings);
  const [status, setStatus] = useState<StreamStatus>("idle");
  const [streamDuration, setStreamDuration] = useState(0);
  const [cameraFacing, setCameraFacing] = useState<"front" | "back">("back");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem("stream_config");
        if (saved) setConfigState(JSON.parse(saved));
        const savedOverlayV5 = await AsyncStorage.getItem("overlay_config_v5");
        if (savedOverlayV5) {
          setOverlayState({ ...defaultOverlay, ...JSON.parse(savedOverlayV5) });
        } else {
          const savedOverlayV4 = await AsyncStorage.getItem("overlay_config_v4");
          if (savedOverlayV4) {
            const old = JSON.parse(savedOverlayV4) as Record<string, unknown>;
            const migratedTickerItems: TickerItem[] = Array.isArray(old.runningTexts)
              ? (old.runningTexts as string[])
                  .filter(Boolean)
                  .map((t, i) => ({ id: `migrated_${i}`, label: "INFO", content: t }))
              : defaultOverlay.tickerItems;
            const migrated: OverlayConfig = {
              ...defaultOverlay,
              ...(old as Partial<OverlayConfig>),
              tickerItems: migratedTickerItems,
            };
            setOverlayState(migrated);
            await AsyncStorage.setItem("overlay_config_v5", JSON.stringify(migrated));
          } else {
            const oldRaw =
              (await AsyncStorage.getItem("overlay_config_v3")) ??
              (await AsyncStorage.getItem("overlay_config_v2"));
            if (oldRaw) {
              const old = JSON.parse(oldRaw) as Record<string, unknown>;
              const oldLogos: LogoItem[] =
                old.logoUri && typeof old.logoUri === "string"
                  ? [
                      {
                        id: "migrated_1",
                        uri: old.logoUri,
                        position:
                          (old.logoPosition as { x: number; y: number }) ??
                          { x: 16, y: 80 },
                        size: typeof old.logoSize === "number" ? old.logoSize : 80,
                      },
                    ]
                  : [];
              const migrated: OverlayConfig = {
                ...defaultOverlay,
                ...(old as Partial<OverlayConfig>),
                logos: oldLogos,
                tickerItems: defaultOverlay.tickerItems,
              };
              setOverlayState(migrated);
              await AsyncStorage.setItem("overlay_config_v5", JSON.stringify(migrated));
            }
          }
        }
        const savedSettings = await AsyncStorage.getItem("stream_settings");
        if (savedSettings) setSettingsState(JSON.parse(savedSettings));
      } catch {}
    })();
  }, []);

  const setConfig = useCallback(async (c: StreamConfig) => {
    setConfigState(c);
    await AsyncStorage.setItem("stream_config", JSON.stringify(c));
  }, []);

  const setOverlay = useCallback(async (partial: Partial<OverlayConfig>) => {
    setOverlayState((prev) => {
      const next = { ...prev, ...partial };
      AsyncStorage.setItem("overlay_config_v5", JSON.stringify(next));
      return next;
    });
  }, []);

  const setSettings = useCallback(async (partial: Partial<StreamSettings>) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...partial };
      AsyncStorage.setItem("stream_settings", JSON.stringify(next));
      return next;
    });
  }, []);

  const toggleCamera = useCallback(() => {
    setCameraFacing((prev) => (prev === "back" ? "front" : "back"));
  }, []);

  const startStream = useCallback(() => {
    if (!config.streamKey.trim()) return;
    setStatus("connecting");
    setStreamDuration(0);
  }, [config.streamKey]);

  const stopStream = useCallback(() => {
    setStatus("disconnecting");
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const updateStatus = useCallback((s: StreamStatus) => {
    setStatus(s);
    if (s === "live") {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setStreamDuration((d) => d + 1);
      }, 1000);
    } else if (s === "idle") {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setStreamDuration(0);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <StreamContext.Provider
      value={{
        config,
        setConfig,
        overlay,
        setOverlay,
        settings,
        setSettings,
        status,
        streamDuration,
        cameraFacing,
        toggleCamera,
        startStream,
        stopStream,
        updateStatus,
      }}
    >
      {children}
    </StreamContext.Provider>
  );
}

export function useStream() {
  const ctx = useContext(StreamContext);
  if (!ctx) throw new Error("useStream must be used within StreamProvider");
  return ctx;
}
