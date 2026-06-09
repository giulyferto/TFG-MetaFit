import { IconSymbol } from "@/components/ui/icon-symbol";
import { ThemedText } from "@/components/ui/themed-text";
import { MetaFitColors } from "@/constants/theme";
import { CameraView, useCameraPermissions } from "expo-camera";
import React, { Component, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  onEANDetectado: (ean: string) => void;
  onFallbackFoto: () => void;
  onCerrar: () => void;
};

class CameraErrorBoundary extends Component<
  { onError: () => void; children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch() { this.props.onError(); }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

const TIMEOUT_SEGUNDOS = 12;

export function BarcodeScannerOverlay({ onEANDetectado, onFallbackFoto, onCerrar }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [segundosRestantes, setSegundosRestantes] = useState(TIMEOUT_SEGUNDOS);
  const [cambiandoAFoto, setCambiandoAFoto] = useState(false);
  const yaDetectado = useRef(false);
  const fallbackLanzado = useRef(false);

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, []);

  // Countdown — al llegar a 0 lanza el fallback automáticamente
  useEffect(() => {
    if (segundosRestantes <= 0) {
      if (fallbackLanzado.current) return;
      fallbackLanzado.current = true;
      setCambiandoAFoto(true);
      // Pequeño delay para que el usuario vea el mensaje antes de que se abra la cámara
      setTimeout(() => onFallbackFoto(), 600);
      return;
    }
    const t = setTimeout(() => setSegundosRestantes((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [segundosRestantes]);

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (yaDetectado.current) return;
    // Solo aceptar EAN-13 (13 dígitos) o UPC-A (12 dígitos)
    if (!/^\d{12,13}$/.test(data)) return;
    yaDetectado.current = true;
    onEANDetectado(data);
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color="white" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <ThemedText style={styles.permisoText}>
          Se necesita acceso a la cámara para escanear el código de barras.
        </ThemedText>
        <TouchableOpacity style={styles.permisoButton} onPress={requestPermission}>
          <ThemedText style={styles.permisoButtonText}>Dar permiso</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cerrarButton} onPress={onCerrar}>
          <ThemedText style={styles.cerrarText}>Cancelar</ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraErrorBoundary onError={onFallbackFoto}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          onBarcodeScanned={handleBarcodeScanned}
          barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e"] }}
        />
      </CameraErrorBoundary>

      {/* Oscurecido alrededor del frame */}
      <View style={styles.overlay}>
        <View style={styles.overlayTop} />
        <View style={styles.overlayMiddleRow}>
          <View style={styles.overlaySide} />
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
          <View style={styles.overlaySide} />
        </View>
        <View style={styles.overlayBottom}>
          <ThemedText style={styles.hintText}>
            Apuntá al código de barras del producto
          </ThemedText>

          {cambiandoAFoto ? (
            <View style={styles.cambiandoRow}>
              <ActivityIndicator size="small" color="white" />
              <ThemedText style={styles.cambiandoText}>Cambiando a foto...</ThemedText>
            </View>
          ) : (
            <ThemedText style={styles.countdownText}>
              Cambiando a foto en {segundosRestantes}s
            </ThemedText>
          )}
        </View>
      </View>

      {/* Botón cerrar */}
      <TouchableOpacity style={styles.xButton} onPress={onCerrar}>
        <IconSymbol name="xmark" size={18} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const FRAME_W = 280;
const FRAME_H = 160;
const CORNER = 20;
const BORDER = 3;

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayTop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  overlayMiddleRow: {
    flexDirection: "row",
    height: FRAME_H,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  scanFrame: {
    width: FRAME_W,
    height: FRAME_H,
  },
  corner: {
    position: "absolute",
    width: CORNER,
    height: CORNER,
    borderColor: "white",
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: BORDER, borderLeftWidth: BORDER },
  cornerTR: { top: 0, right: 0, borderTopWidth: BORDER, borderRightWidth: BORDER },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: BORDER, borderLeftWidth: BORDER },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: BORDER, borderRightWidth: BORDER },
  overlayBottom: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    paddingTop: 24,
    gap: 16,
  },
  hintText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  countdownText: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
  },
  cambiandoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cambiandoText: {
    color: "white",
    fontSize: 13,
    fontWeight: "600",
  },
  xButton: {
    position: "absolute",
    top: 60,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  permisoText: {
    color: "white",
    fontSize: 15,
    textAlign: "center",
    paddingHorizontal: 40,
    marginBottom: 20,
  },
  permisoButton: {
    backgroundColor: MetaFitColors.button.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  permisoButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "700",
  },
  cerrarButton: { padding: 12 },
  cerrarText: { color: "rgba(255,255,255,0.7)", fontSize: 14 },
});
