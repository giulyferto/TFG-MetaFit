import { IconSymbol } from "@/components/ui/icon-symbol";
import { ThemedText } from "@/components/ui/themed-text";
import { MetaFitColors } from "@/constants/theme";
import type { Consumo } from "@/utils/consumos";
import { obtenerFeedbackDeRegistro } from "@/utils/feedback";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { ActionSheetIOS, ActivityIndicator, Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import Markdown from "react-native-markdown-display";

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
  fechaSeleccionada?: Date;
  onAgregarComida?: () => void;
  onEliminar?: (id: string) => void;
  onEditar?: (consumo: Consumo) => void;
  onReagregar?: (consumo: Consumo) => void;
  actionsMode?: "inline" | "sheet";
};

function esMismaFecha(a: Date, b: Date) {
  return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
}

function formatearFechaLarga(fecha: Date): string {
  const meses = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  const hoy = new Date();
  if (fecha.getFullYear() === hoy.getFullYear()) {
    return `el ${fecha.getDate()} de ${meses[fecha.getMonth()]}`;
  }
  return `el ${fecha.getDate()} de ${meses[fecha.getMonth()]} de ${fecha.getFullYear()}`;
}

export function TablaConsumos({
  consumos,
  isLoading,
  itemsPerPage = 5,
  fechaSeleccionada,
  onAgregarComida,
  onEliminar,
  onEditar,
  onReagregar,
  actionsMode = "inline",
}: TablaConsumosProps) {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [feedbackConsumo, setFeedbackConsumo] = useState<Consumo | null>(null);
  const [feedbackTexto, setFeedbackTexto] = useState<string>("");
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  useEffect(() => {
    setCurrentPage(1);
    setExpandedCardId(null);
  }, [consumos.length]);

  const toggleExpand = (id: string) => {
    setExpandedCardId(prev => prev === id ? null : id);
  };

  const handleVerFeedback = async (consumo: Consumo) => {
    setFeedbackConsumo(consumo);
    setFeedbackTexto("");
    setFeedbackLoading(true);
    try {
      const fb = await obtenerFeedbackDeRegistro(consumo.id);
      setFeedbackTexto(fb?.texto ?? "No hay análisis guardado para esta comida.");
    } catch {
      setFeedbackTexto("No se pudo cargar el análisis.");
    } finally {
      setFeedbackLoading(false);
    }
  };

  const totalPages = Math.ceil(consumos.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const consumosPaginaActual = consumos.slice(startIndex, endIndex);

  const getCalificacionColor = (calificacion: Consumo["calificacion"]) => {
    switch (calificacion) {
      case "Muy saludable": case "Alta":  return MetaFitColors.calificacion.alta;
      case "Equilibrada":   case "Media": return MetaFitColors.calificacion.media;
      case "Poco nutritiva": case "Baja": return MetaFitColors.calificacion.baja;
      default:                            return MetaFitColors.text.tertiary;
    }
  };

  const getCalificacionBg = (calificacion: Consumo["calificacion"]) => {
    switch (calificacion) {
      case "Muy saludable": case "Alta":   return "rgba(74, 158, 107, 0.1)";
      case "Equilibrada":   case "Media":  return "rgba(201, 148, 58, 0.1)";
      case "Poco nutritiva": case "Baja":  return "rgba(201, 72, 72, 0.1)";
      default:                             return MetaFitColors.background.elevated;
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
    const esHoy = !fechaSeleccionada || esMismaFecha(fechaSeleccionada, new Date());
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconWrapper}>
          <IconSymbol name="fork.knife" size={36} color={MetaFitColors.text.tertiary} />
        </View>
        <ThemedText style={styles.emptyTitle} lightColor={MetaFitColors.text.primary}>
          {esHoy ? "Sin registros aún" : "Sin registros ese día"}
        </ThemedText>
        <ThemedText style={styles.emptySubtitle} lightColor={MetaFitColors.text.secondary}>
          {esHoy
            ? "Registra tu primera comida del día para comenzar a rastrear tu nutrición"
            : `No agregaste ninguna comida ${formatearFechaLarga(fechaSeleccionada!)}`}
        </ThemedText>
        {onAgregarComida && (
          <Pressable style={styles.emptyButton} onPress={onAgregarComida}>
            <ThemedText style={styles.emptyButtonText}>Agregar comida</ThemedText>
          </Pressable>
        )}
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

  const handleCardPress = (consumo: Consumo) => {
    const titulo = consumo.nombre || consumo.tipoComida || "Registro";
    const tieneFeedback = consumo.calificacion !== null;

    if (Platform.OS === "ios") {
      const opciones = tieneFeedback
        ? ["Cancelar", "Ver análisis", "Editar", "Agregar de nuevo", "Eliminar"]
        : ["Cancelar", "Editar", "Agregar de nuevo", "Eliminar"];
      const destructiveIndex = opciones.length - 1;

      ActionSheetIOS.showActionSheetWithOptions(
        { options: opciones, cancelButtonIndex: 0, destructiveButtonIndex: destructiveIndex, title: titulo },
        (idx) => {
          if (tieneFeedback) {
            if (idx === 1) handleVerFeedback(consumo);
            else if (idx === 2) onEditar?.(consumo);
            else if (idx === 3) onReagregar?.(consumo);
            else if (idx === 4) handleEliminar(consumo);
          } else {
            if (idx === 1) onEditar?.(consumo);
            else if (idx === 2) onReagregar?.(consumo);
            else if (idx === 3) handleEliminar(consumo);
          }
        }
      );
    } else {
      Alert.alert(titulo, undefined, [
        ...(tieneFeedback ? [{ text: "Ver análisis", onPress: () => handleVerFeedback(consumo) }] : []),
        { text: "Editar", onPress: () => onEditar?.(consumo) },
        { text: "Agregar de nuevo", onPress: () => onReagregar?.(consumo) },
        { text: "Eliminar", style: "destructive" as const, onPress: () => handleEliminar(consumo) },
        { text: "Cancelar", style: "cancel" as const },
      ]);
    }
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

          const hasInlineActions = onEditar || onReagregar || onEliminar || !!consumo.calificacion;
          const isExpanded = expandedCardId === consumo.id;

          const CardWrapper = TouchableOpacity;
          const cardWrapperProps = actionsMode === "sheet" && (onEditar || onReagregar || onEliminar)
            ? { activeOpacity: 0.75, onPress: () => handleCardPress(consumo) }
            : actionsMode === "inline" && hasInlineActions
            ? { activeOpacity: 0.97, onPress: () => toggleExpand(consumo.id) }
            : { activeOpacity: 1 };

          return (
            <CardWrapper key={consumo.id} style={styles.consumoCard} {...cardWrapperProps}>
              {/* Colored left accent bar */}
              <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

              {/* Card body */}
              <View style={styles.cardBody}>
                {/* Top: name + thumbnail */}
                <View style={styles.topRow}>
                  <View style={styles.topRowLeft}>
                    <ThemedText
                      style={styles.nombreText}
                      lightColor={MetaFitColors.text.primary}
                      numberOfLines={2}
                    >
                      {nombre}
                    </ThemedText>

                    {/* Nutrition strip */}
                    {consumo.energia && (
                      <View style={styles.nutritionStrip}>
                        {/* Calories chip */}
                        <View style={styles.calChip}>
                          <ThemedText style={styles.calValue} lightColor={MetaFitColors.button.primary}>
                            {Math.round(parseFloat(consumo.energia))}
                          </ThemedText>
                          <ThemedText style={styles.calUnit} lightColor={MetaFitColors.text.tertiary}>
                            kcal
                          </ThemedText>
                        </View>

                        {/* Proportional macro bar + labels */}
                        {consumo.proteina && consumo.carb && consumo.grasa && (() => {
                          const p = parseFloat(consumo.proteina) * 4;
                          const c = parseFloat(consumo.carb) * 4;
                          const g = parseFloat(consumo.grasa) * 9;
                          const total = p + c + g;
                          if (total === 0) return null;
                          return (
                            <View style={styles.macroBarWrapper}>
                              <View style={styles.macroBar}>
                                <View style={[styles.macroSegment, { flex: p / total, backgroundColor: "#E8636A" }]} />
                                <View style={[styles.macroSegment, { flex: c / total, backgroundColor: "#E8A542" }]} />
                                <View style={[styles.macroSegment, { flex: g / total, backgroundColor: MetaFitColors.button.primary }]} />
                              </View>
                              <View style={styles.macroLabels}>
                                <ThemedText style={[styles.macroLabel, { color: "#E8636A" }]}>
                                  P {Math.round(parseFloat(consumo.proteina))}g
                                </ThemedText>
                                <ThemedText style={styles.macroDivider} lightColor={MetaFitColors.text.tertiary}>·</ThemedText>
                                <ThemedText style={[styles.macroLabel, { color: "#C47A2B" }]}>
                                  C {Math.round(parseFloat(consumo.carb))}g
                                </ThemedText>
                                <ThemedText style={styles.macroDivider} lightColor={MetaFitColors.text.tertiary}>·</ThemedText>
                                <ThemedText style={[styles.macroLabel, { color: MetaFitColors.button.primary }]}>
                                  G {Math.round(parseFloat(consumo.grasa))}g
                                </ThemedText>
                              </View>
                            </View>
                          );
                        })()}
                      </View>
                    )}
                  </View>

                  <View style={styles.thumbnailSlot}>
                    {consumo.imagenUrl && (
                      <Image
                        source={{ uri: consumo.imagenUrl }}
                        style={styles.thumbnail}
                        contentFit="cover"
                      />
                    )}
                  </View>
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
                  {actionsMode === "inline" && hasInlineActions && (
                    <IconSymbol
                      name={isExpanded ? "chevron.up" : "chevron.down"}
                      size={11}
                      color={MetaFitColors.text.tertiary}
                      style={styles.expandChevron}
                    />
                  )}
                </View>

                {/* Action buttons — solo en modo inline, expandibles */}
                {actionsMode === "inline" && isExpanded && (onEditar || onEliminar || onReagregar || consumo.calificacion) && (
                  <View style={styles.cardActions}>
                    {/* Fila 1: Ver análisis — ancho completo */}
                    {consumo.calificacion && (
                      <TouchableOpacity
                        style={styles.actionButtonFeedback}
                        onPress={() => handleVerFeedback(consumo)}
                        activeOpacity={0.7}
                      >
                        <IconSymbol name="text.bubble" size={13} color={MetaFitColors.button.primary} />
                        <ThemedText style={styles.actionButtonFeedbackText} lightColor={MetaFitColors.button.primary}>
                          Ver análisis
                        </ThemedText>
                      </TouchableOpacity>
                    )}

                    {/* Fila 2: utilidades */}
                    {(onReagregar || onEditar || onEliminar) && (
                      <View style={styles.cardActionsRow}>
                        {onReagregar && (
                          <TouchableOpacity
                            style={[styles.actionButton, { flex: 1 }]}
                            onPress={() => onReagregar(consumo)}
                            activeOpacity={0.7}
                          >
                            <IconSymbol name="plus" size={12} color={MetaFitColors.button.primary} />
                            <ThemedText style={styles.actionButtonText} lightColor={MetaFitColors.button.primary}>
                              Agregar de nuevo
                            </ThemedText>
                          </TouchableOpacity>
                        )}
                        {onEditar && (
                          <TouchableOpacity
                            style={styles.actionButtonIcon}
                            onPress={() => onEditar(consumo)}
                            activeOpacity={0.7}
                          >
                            <IconSymbol name="pencil" size={14} color={MetaFitColors.text.secondary} />
                          </TouchableOpacity>
                        )}
                        {onEliminar && (
                          <TouchableOpacity
                            style={[styles.actionButtonIcon, styles.actionButtonIconDanger]}
                            onPress={() => handleEliminar(consumo)}
                            activeOpacity={0.7}
                          >
                            <IconSymbol name="trash" size={14} color={MetaFitColors.calificacion.baja} />
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </View>
                )}
              </View>
            </CardWrapper>
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
      {onAgregarComida && (
        <Pressable style={styles.addButton} onPress={onAgregarComida}>
          <ThemedText style={styles.addButtonText}>+ Agregar comida</ThemedText>
        </Pressable>
      )}

      {/* Feedback modal */}
      <Modal
        visible={feedbackConsumo !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setFeedbackConsumo(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {/* Handle bar */}
            <View style={styles.modalHandle} />

            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <ThemedText style={styles.modalTitle} lightColor={MetaFitColors.text.primary}>
                  Análisis nutricional
                </ThemedText>
                {feedbackConsumo?.nombre && (
                  <ThemedText style={styles.modalSubtitle} lightColor={MetaFitColors.text.secondary} numberOfLines={1}>
                    {feedbackConsumo.nombre}
                  </ThemedText>
                )}
              </View>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setFeedbackConsumo(null)}>
                <IconSymbol name="xmark" size={16} color={MetaFitColors.text.secondary} />
              </TouchableOpacity>
            </View>

            {/* Calificación badge */}
            {feedbackConsumo?.calificacion && (
              <View style={[styles.modalCalBadge, { backgroundColor: getCalificacionBg(feedbackConsumo.calificacion) }]}>
                <View style={[styles.modalCalDot, { backgroundColor: getCalificacionColor(feedbackConsumo.calificacion) }]} />
                <ThemedText style={[styles.modalCalText, { color: getCalificacionColor(feedbackConsumo.calificacion) }]}>
                  {feedbackConsumo.calificacion}
                </ThemedText>
              </View>
            )}

            {/* Content */}
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {feedbackLoading ? (
                <View style={styles.modalLoading}>
                  <ActivityIndicator color={MetaFitColors.button.primary} />
                  <ThemedText style={styles.modalLoadingText} lightColor={MetaFitColors.text.secondary}>
                    Cargando análisis...
                  </ThemedText>
                </View>
              ) : (
                <Markdown style={markdownStyles}>
                  {feedbackTexto.replace(/\n*Calificaci[oó]n:\s*\[?(Muy[_ ]saludable|Equilibrada|Poco[_ ]nutritiv[ao]|Alta|Media|Baja)\]?\s*$/i, "").trim()}
                </Markdown>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  emptyButton: {
    marginTop: 20,
    backgroundColor: MetaFitColors.button.primary,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  addButton: {
    marginTop: 14,
    alignSelf: "center",
    borderWidth: 1.5,
    borderColor: MetaFitColors.button.primary,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  addButtonText: {
    color: MetaFitColors.button.primary,
    fontSize: 14,
    fontWeight: "600",
  },

  // Card list
  cardsList: {
    gap: 8,
    marginBottom: 4,
  },
  consumoCard: {
    flexDirection: "row",
    backgroundColor: MetaFitColors.background.card,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
    overflow: "hidden",
  },

  // Left accent bar
  accentBar: {
    width: 3,
    borderTopLeftRadius: 13,
    borderBottomLeftRadius: 13,
  },

  // Card body (everything to the right of the bar)
  cardBody: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 6,
  },

  // Name + thumbnail row
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  topRowLeft: {
    flex: 1,
    gap: 5,
  },
  nombreText: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 19,
  },
  thumbnailSlot: {
    width: 46,
    height: 46,
    flexShrink: 0,
  },
  thumbnail: {
    width: 46,
    height: 46,
    borderRadius: 8,
    flexShrink: 0,
  },

  // Nutrition strip
  nutritionStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  calChip: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
    backgroundColor: MetaFitColors.background.elevated,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: MetaFitColors.border.accent,
    flexShrink: 0,
  },
  calValue: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  calUnit: {
    fontSize: 10,
    fontWeight: "500",
  },
  macroBarWrapper: {
    flex: 1,
    gap: 4,
  },
  macroBar: {
    flexDirection: "row",
    height: 5,
    borderRadius: 3,
    overflow: "hidden",
    gap: 1,
  },
  macroSegment: {
    borderRadius: 3,
  },
  macroLabels: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  macroLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.1,
  },
  macroDivider: {
    fontSize: 9,
    fontWeight: "400",
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
  expandChevron: {
    marginLeft: 4,
  },

  // Action buttons
  cardActions: {
    gap: 7,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: MetaFitColors.border.light,
  },
  // Fila secundaria de utilidades
  cardActionsRow: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  // Botón con texto (Agregar de nuevo — flex:1 en su fila)
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: MetaFitColors.background.elevated,
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  // Botones icono compactos (Editar / Eliminar)
  actionButtonIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: MetaFitColors.background.elevated,
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
  },
  actionButtonIconDanger: {
    backgroundColor: "rgba(201, 72, 72, 0.07)",
    borderColor: "rgba(201, 72, 72, 0.18)",
  },
  // Botón "Ver análisis" — ancho completo, estilo destacado
  actionButtonFeedback: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: MetaFitColors.background.elevated,
    borderWidth: 1,
    borderColor: MetaFitColors.border.accent,
  },
  actionButtonFeedbackText: {
    fontSize: 12,
    fontWeight: "700",
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

  // Feedback modal
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  modalSheet: {
    backgroundColor: MetaFitColors.background.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 48,
    maxHeight: "80%",
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: MetaFitColors.border.light,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 14,
    gap: 12,
  },
  modalHeaderLeft: {
    flex: 1,
    gap: 2,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  modalSubtitle: {
    fontSize: 13,
    fontWeight: "500",
  },
  modalCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: MetaFitColors.background.elevated,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCalBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 14,
  },
  modalCalDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  modalCalText: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  modalScroll: {
    flexGrow: 0,
  },
  modalLoading: {
    paddingVertical: 40,
    alignItems: "center",
    gap: 12,
  },
  modalLoadingText: {
    fontSize: 14,
  },
});

const markdownStyles = StyleSheet.create({
  body: {
    fontSize: 14,
    lineHeight: 22,
    color: MetaFitColors.text.primary,
  },
  heading1: { fontSize: 18, fontWeight: "700", color: MetaFitColors.text.primary, marginTop: 14, marginBottom: 6 },
  heading2: { fontSize: 16, fontWeight: "700", color: MetaFitColors.text.primary, marginTop: 12, marginBottom: 5 },
  heading3: { fontSize: 14, fontWeight: "600", color: MetaFitColors.button.primary, marginTop: 10, marginBottom: 4 },
  strong: { fontWeight: "700", color: MetaFitColors.text.primary },
  em: { fontStyle: "italic", color: MetaFitColors.text.secondary },
  text: { fontSize: 14, lineHeight: 22, color: MetaFitColors.text.primary },
  bullet_list: { marginTop: 6, marginBottom: 6 },
  ordered_list: { marginTop: 6, marginBottom: 6 },
  list_item: { marginBottom: 4 },
  paragraph: { marginTop: 6, marginBottom: 6 },
});
