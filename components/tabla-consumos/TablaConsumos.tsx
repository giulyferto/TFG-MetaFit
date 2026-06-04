import { IconSymbol } from "@/components/ui/icon-symbol";
import { ThemedText } from "@/components/ui/themed-text";
import { MetaFitColors } from "@/constants/theme";
import type { Consumo } from "@/utils/consumos";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, TouchableOpacity, View } from "react-native";

const TIPO_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  Desayuno: { label: "Desayuno", color: "#C47A2B", bg: "rgba(228, 160, 60, 0.12)" },
  Almuerzo: { label: "Almuerzo", color: "#2B7FA8", bg: "rgba(60, 160, 210, 0.12)" },
  Cena:     { label: "Cena",     color: "#6B5EA8", bg: "rgba(130, 110, 210, 0.12)" },
  Snack:    { label: "Snack",    color: "#3A8F5C", bg: "rgba(60, 160, 100, 0.12)" },
  Otro:     { label: "Otro",     color: "#7A7A8A", bg: "rgba(150, 150, 170, 0.10)" },
};

function formatearFechaRelativa(fechaISO: string): string {
  const fecha = new Date(fechaISO);
  const hoy = new Date();
  const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

  const mismaFecha = (a: Date, b: Date) =>
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();

  if (mismaFecha(fecha, hoy)) return "Hoy";

  const ayer = new Date(hoy);
  ayer.setDate(hoy.getDate() - 1);
  if (mismaFecha(fecha, ayer)) return "Ayer";

  if (fecha.getFullYear() === hoy.getFullYear()) {
    return `${fecha.getDate()} ${meses[fecha.getMonth()]}`;
  }
  return `${fecha.getDate()} ${meses[fecha.getMonth()]} ${fecha.getFullYear()}`;
}

type TablaConsumosProps = {
  consumos: Consumo[];
  isLoading: boolean;
  itemsPerPage?: number;
  onEliminar?: (id: string) => void;
  onEditar?: (consumo: Consumo) => void;
  onReagregar?: (consumo: Consumo) => void;
};

export function TablaConsumos({
  consumos,
  isLoading,
  itemsPerPage = 5,
  onEliminar,
  onEditar,
  onReagregar,
}: TablaConsumosProps) {
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [consumos.length]);

  const totalPages = Math.ceil(consumos.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const consumosPaginaActual = consumos.slice(startIndex, endIndex);

  const getCalificacionColor = (calificacion: Consumo["calificacion"]) => {
    switch (calificacion) {
      case "Alta":  return MetaFitColors.calificacion.alta;
      case "Media": return MetaFitColors.calificacion.media;
      case "Baja":  return MetaFitColors.calificacion.baja;
      default:      return MetaFitColors.text.tertiary;
    }
  };

  const getCalificacionBg = (calificacion: Consumo["calificacion"]) => {
    switch (calificacion) {
      case "Alta":  return "rgba(74, 158, 107, 0.1)";
      case "Media": return "rgba(201, 148, 58, 0.1)";
      case "Baja":  return "rgba(201, 72, 72, 0.1)";
      default:      return MetaFitColors.background.elevated;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.stateContainer}>
        <ActivityIndicator size="small" color={MetaFitColors.button.primary} />
        <ThemedText style={styles.stateText} lightColor={MetaFitColors.text.secondary}>
          Cargando consumos...
        </ThemedText>
      </View>
    );
  }

  if (consumos.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconWrapper}>
          <ThemedText style={styles.emptyIcon}>🥗</ThemedText>
        </View>
        <ThemedText style={styles.emptyTitle} lightColor={MetaFitColors.text.primary}>
          Sin registros aún
        </ThemedText>
        <ThemedText style={styles.emptySubtitle} lightColor={MetaFitColors.text.secondary}>
          Registra tu primera comida para comenzar a rastrear tu nutrición
        </ThemedText>
      </View>
    );
  }

  const handleEliminar = (consumo: Consumo) => {
    Alert.alert(
      "Eliminar registro",
      `¿Eliminar "${consumo.nombre || consumo.tipoComida || "este registro"}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: () => onEliminar?.(consumo.id) },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.cardsList}>
        {consumosPaginaActual.map((consumo) => {
          const tipoConfig = consumo.tipoComida ? TIPO_CONFIG[consumo.tipoComida] : null;
          const accentColor = tipoConfig?.color ?? MetaFitColors.border.light;
          const sinFecha = consumo.descripcion.replace(/ - \d{2}\/\d{2}\/\d{4}$/, "");
          const nombre = consumo.tipoComida && sinFecha.startsWith(consumo.tipoComida + " - ")
            ? sinFecha.slice(consumo.tipoComida.length + 3)
            : sinFecha;
          const fechaRelativa = formatearFechaRelativa(consumo.fechaCreacion);
          const calColor = getCalificacionColor(consumo.calificacion);
          const calBg = getCalificacionBg(consumo.calificacion);

          return (
            <View key={consumo.id} style={styles.consumoCard}>
              {/* Colored left accent bar */}
              <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

              {/* Card body */}
              <View style={styles.cardBody}>
                {/* Top: name + thumbnail */}
                <View style={styles.topRow}>
                  <ThemedText
                    style={styles.nombreText}
                    lightColor={MetaFitColors.text.primary}
                    numberOfLines={2}
                  >
                    {nombre}
                  </ThemedText>
                  {consumo.imagenUrl && (
                    <Image
                      source={{ uri: consumo.imagenUrl }}
                      style={styles.thumbnail}
                      contentFit="cover"
                    />
                  )}
                </View>

                {/* Bottom: tipo + fecha + calificación */}
                <View style={styles.metaRow}>
                  {tipoConfig && (
                    <ThemedText style={[styles.tipoText, { color: accentColor }]}>
                      {tipoConfig.label}
                    </ThemedText>
                  )}
                  {tipoConfig && (
                    <ThemedText style={styles.metaSep} lightColor={MetaFitColors.text.tertiary}>·</ThemedText>
                  )}
                  <ThemedText style={styles.fechaText} lightColor={MetaFitColors.text.tertiary}>
                    {fechaRelativa}
                  </ThemedText>
                  <View style={styles.metaSpacer} />
                  <View style={[styles.calBadge, { backgroundColor: calBg }]}>
                    <View style={[styles.calDot, { backgroundColor: calColor }]} />
                    <ThemedText style={[styles.calText, { color: calColor }]}>
                      {consumo.calificacion ?? "Sin calificar"}
                    </ThemedText>
                  </View>
                </View>

                {/* Action buttons */}
                {(onEditar || onEliminar || onReagregar) && (
                  <View style={styles.cardActions}>
                    {onReagregar && (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.actionButtonReagregar]}
                        onPress={() => onReagregar(consumo)}
                        activeOpacity={0.7}
                      >
                        <IconSymbol name="plus" size={13} color={MetaFitColors.button.primary} />
                        <ThemedText style={styles.actionButtonText} lightColor={MetaFitColors.button.primary}>
                          Agregar de nuevo
                        </ThemedText>
                      </TouchableOpacity>
                    )}
                    {onEditar && (
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => onEditar(consumo)}
                        activeOpacity={0.7}
                      >
                        <IconSymbol name="pencil" size={13} color={MetaFitColors.button.primary} />
                        <ThemedText style={styles.actionButtonText} lightColor={MetaFitColors.button.primary}>
                          Editar
                        </ThemedText>
                      </TouchableOpacity>
                    )}
                    {onEliminar && (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.actionButtonDanger]}
                        onPress={() => handleEliminar(consumo)}
                        activeOpacity={0.7}
                      >
                        <IconSymbol name="trash" size={13} color={MetaFitColors.calificacion.baja} />
                        <ThemedText style={styles.actionButtonText} lightColor={MetaFitColors.calificacion.baja}>
                          Eliminar
                        </ThemedText>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* Pagination */}
      {consumos.length > itemsPerPage && (
        <View style={styles.paginationContainer}>
          <TouchableOpacity
            style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
            onPress={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            activeOpacity={0.7}
          >
            <ThemedText
              style={styles.paginationButtonText}
              lightColor={currentPage === 1 ? MetaFitColors.text.tertiary : MetaFitColors.text.primary}
            >
              ← Anterior
            </ThemedText>
          </TouchableOpacity>

          <ThemedText style={styles.paginationInfo} lightColor={MetaFitColors.text.tertiary}>
            {currentPage} / {totalPages}
          </ThemedText>

          <TouchableOpacity
            style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
            onPress={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            activeOpacity={0.7}
          >
            <ThemedText
              style={styles.paginationButtonText}
              lightColor={currentPage === totalPages ? MetaFitColors.text.tertiary : MetaFitColors.text.primary}
            >
              Siguiente →
            </ThemedText>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  stateContainer: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  stateText: {
    fontSize: 14,
  },
  emptyContainer: {
    paddingBottom: 36,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: MetaFitColors.background.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
  },
  emptyIconWrapper: {
    paddingTop: 36,
    paddingBottom: 12,
    alignItems: "center",
  },
  emptyIcon: {
    fontSize: 44,
    lineHeight: 54,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },

  // Card list
  cardsList: {
    gap: 10,
    marginBottom: 4,
  },
  consumoCard: {
    flexDirection: "row",
    backgroundColor: MetaFitColors.background.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
    overflow: "hidden",
  },

  // Left accent bar
  accentBar: {
    width: 4,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },

  // Card body (everything to the right of the bar)
  cardBody: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },

  // Name + thumbnail row
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  nombreText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 21,
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: 9,
    flexShrink: 0,
  },

  // Metadata row: tipo · fecha  [spacer]  calificación
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  tipoText: {
    fontSize: 12,
    fontWeight: "700",
  },
  metaSep: {
    fontSize: 11,
  },
  fechaText: {
    fontSize: 12,
    fontWeight: "500",
  },
  metaSpacer: {
    flex: 1,
  },
  calBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  calDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  calText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  // Action buttons
  cardActions: {
    flexDirection: "row",
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: MetaFitColors.border.light,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 7,
    backgroundColor: MetaFitColors.background.elevated,
  },
  actionButtonDanger: {
    backgroundColor: "rgba(201, 72, 72, 0.08)",
  },
  actionButtonReagregar: {
    backgroundColor: MetaFitColors.background.elevated,
    borderWidth: 1,
    borderColor: MetaFitColors.border.accent,
  },
  actionButtonText: {
    fontSize: 11,
    fontWeight: "600",
  },

  // Pagination
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
    paddingHorizontal: 4,
  },
  paginationButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: MetaFitColors.background.card,
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
  },
  paginationButtonDisabled: {
    opacity: 0.35,
  },
  paginationButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  paginationInfo: {
    fontSize: 13,
    fontWeight: "500",
  },
});
