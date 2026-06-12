import { IconSymbol } from "@/components/ui/icon-symbol";
import { ThemedText } from "@/components/ui/themed-text";
import { MetaFitColors } from "@/constants/theme";
import { obtenerConsumosPorRango, type Consumo } from "@/utils/consumos";
import { getNutritionalProfile } from "@/utils/nutritional-profile";
import { analizarPatronAlimenticio, type AnalizarPatronResponse } from "@/utils/openai";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ModoPeriodo = "7dias" | "30dias" | "personalizado";
type PickerActivo = "inicio" | "fin" | null;

const TIPO_CONFIG: Record<string, { emoji: string; color: string; bg: string }> = {
  Desayuno: { emoji: "☀️", color: "#C9943A", bg: "#FFF8EC" },
  Almuerzo: { emoji: "🌿", color: "#4A9E6B", bg: "#F0FAF4" },
  Merienda: { emoji: "🫐", color: "#7B6FD4", bg: "#F3F1FD" },
  Cena: { emoji: "🌙", color: "#5B96B0", bg: "#EEF5F9" },
  Snack: { emoji: "🍎", color: "#C94848", bg: "#FFF0F0" },
  Comida: { emoji: "🍽️", color: "#6B7C8D", bg: "#F5F5F5" },
};

function getCalificacionBadge(cal: "Muy saludable" | "Equilibrada" | "Poco nutritiva") {
  if (cal === "Muy saludable") return { bg: "#F0FAF4", color: "#4A9E6B", label: "Muy saludable" };
  if (cal === "Poco nutritiva") return { bg: "#FFF0F0", color: "#C94848", label: "Poco nutritiva" };
  return { bg: "#FFF8EC", color: "#C9943A", label: "Equilibrada" };
}

function formatDate(date: Date): string {
  const d = date.getDate().toString().padStart(2, "0");
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

export function AnalisisScreen() {
  const scrollViewRef = useRef<ScrollView>(null);

  const [modoPeriodo, setModoPeriodo] = useState<ModoPeriodo>("7dias");
  const [fechaInicio, setFechaInicio] = useState<Date>(() => daysAgo(6));
  const [fechaFin, setFechaFin] = useState<Date>(new Date());
  const [pickerActivo, setPickerActivo] = useState<PickerActivo>(null);
  const [tempDate, setTempDate] = useState<Date>(new Date());

  const [consumos, setConsumos] = useState<Consumo[]>([]);
  const [isLoadingConsumos, setIsLoadingConsumos] = useState(false);
  const [buscado, setBuscado] = useState(false);

  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());

  const [isAnalizando, setIsAnalizando] = useState(false);
  const [resultado, setResultado] = useState<AnalizarPatronResponse | null>(null);
  const [errorAnalisis, setErrorAnalisis] = useState<string | null>(null);

  const aplicarModo = useCallback((modo: ModoPeriodo) => {
    setModoPeriodo(modo);
    setResultado(null);
    setErrorAnalisis(null);
    if (modo === "7dias") {
      setFechaInicio(daysAgo(6));
      setFechaFin(new Date());
    } else if (modo === "30dias") {
      setFechaInicio(daysAgo(29));
      setFechaFin(new Date());
    }
  }, []);

  const cargarConsumos = useCallback(async () => {
    setIsLoadingConsumos(true);
    setResultado(null);
    setErrorAnalisis(null);
    try {
      const data = await obtenerConsumosPorRango(startOfDay(fechaInicio), fechaFin);
      setConsumos(data);
      setSeleccionados(new Set(data.map((c) => c.id)));
      setBuscado(true);
    } catch {
      setConsumos([]);
    } finally {
      setIsLoadingConsumos(false);
    }
  }, [fechaInicio, fechaFin]);

  const toggleSeleccion = (id: string) => {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleTodos = () => {
    if (seleccionados.size === consumos.length) {
      setSeleccionados(new Set());
    } else {
      setSeleccionados(new Set(consumos.map((c) => c.id)));
    }
  };

  const consumosSeleccionados = consumos.filter((c) => seleccionados.has(c.id));

  const totales = consumosSeleccionados.reduce(
    (acc, c) => ({
      energia: acc.energia + parseFloat(c.energia || "0"),
      carb: acc.carb + parseFloat(c.carb || "0"),
      proteina: acc.proteina + parseFloat(c.proteina || "0"),
      grasa: acc.grasa + parseFloat(c.grasa || "0"),
    }),
    { energia: 0, carb: 0, proteina: 0, grasa: 0 }
  );

  const handleAnalizar = async () => {
    if (consumosSeleccionados.length === 0) return;
    setIsAnalizando(true);
    setErrorAnalisis(null);
    setResultado(null);
    try {
      const perfil = await getNutritionalProfile();
      const rangoStr = `${formatDate(fechaInicio)} – ${formatDate(fechaFin)}`;
      const data = await analizarPatronAlimenticio(
        consumosSeleccionados,
        rangoStr,
        perfil ?? undefined
      );
      setResultado(data);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 200);
    } catch (err: any) {
      setErrorAnalisis(err.message || "Error al analizar el patrón alimenticio");
    } finally {
      setIsAnalizando(false);
    }
  };

  // Date picker handlers
  const handleOpenPicker = (cual: "inicio" | "fin") => {
    setTempDate(cual === "inicio" ? fechaInicio : fechaFin);
    setPickerActivo(cual);
  };

  const handlePickerChange = (_: any, date?: Date) => {
    if (Platform.OS === "android") {
      setPickerActivo(null);
      if (date) {
        if (pickerActivo === "inicio") setFechaInicio(date);
        else setFechaFin(date);
      }
    } else {
      if (date) setTempDate(date);
    }
  };

  const handleAcceptDate = () => {
    if (pickerActivo === "inicio") setFechaInicio(tempDate);
    else setFechaFin(tempDate);
    setPickerActivo(null);
  };

  const handleCancelDate = () => {
    setPickerActivo(null);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.pageHeader}>
          <ThemedText style={styles.pageTitle} lightColor={MetaFitColors.text.primary}>
            Análisis
          </ThemedText>
          <ThemedText style={styles.pageSubtitle} lightColor={MetaFitColors.text.secondary}>
            Analiza tus hábitos alimenticios por período
          </ThemedText>
        </View>

        {/* Chips de período */}
        <View style={styles.chipsRow}>
          {(["7dias", "30dias", "personalizado"] as ModoPeriodo[]).map((modo) => {
            const label = modo === "7dias" ? "7 días" : modo === "30dias" ? "30 días" : "Personalizado";
            const activo = modoPeriodo === modo;
            return (
              <TouchableOpacity
                key={modo}
                style={[styles.chip, activo && styles.chipActivo]}
                onPress={() => aplicarModo(modo)}
                activeOpacity={0.7}
              >
                <ThemedText
                  style={[styles.chipText, activo && styles.chipTextActivo]}
                  lightColor={activo ? MetaFitColors.text.white : MetaFitColors.text.secondary}
                >
                  {label}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Selector de fechas */}
        <View style={styles.dateSection}>
          <ThemedText style={styles.dateLabel} lightColor={MetaFitColors.text.secondary}>
            Rango de fechas
          </ThemedText>
          <View style={styles.dateRow}>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => handleOpenPicker("inicio")}
              activeOpacity={0.8}
            >
              <IconSymbol name="calendar" size={16} color={MetaFitColors.button.primary} />
              <ThemedText style={styles.dateButtonText} lightColor={MetaFitColors.text.primary}>
                {formatDate(fechaInicio)}
              </ThemedText>
            </TouchableOpacity>
            <ThemedText style={styles.dateSep} lightColor={MetaFitColors.text.tertiary}>
              –
            </ThemedText>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => handleOpenPicker("fin")}
              activeOpacity={0.8}
            >
              <IconSymbol name="calendar" size={16} color={MetaFitColors.button.primary} />
              <ThemedText style={styles.dateButtonText} lightColor={MetaFitColors.text.primary}>
                {formatDate(fechaFin)}
              </ThemedText>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.buscarBtn} onPress={cargarConsumos} activeOpacity={0.8}>
            <IconSymbol name="magnifyingglass" size={16} color={MetaFitColors.text.white} />
            <ThemedText style={styles.buscarBtnText} lightColor={MetaFitColors.text.white}>
              Buscar registros
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Date picker iOS */}
        {pickerActivo !== null && Platform.OS === "ios" && (
          <View style={styles.iosPickerContainer}>
            <View style={styles.iosPickerHeader}>
              <TouchableOpacity onPress={handleCancelDate} style={styles.iosPickerBtn}>
                <ThemedText style={styles.iosPickerCancelText} lightColor={MetaFitColors.text.secondary}>
                  Cancelar
                </ThemedText>
              </TouchableOpacity>
              <ThemedText style={styles.iosPickerTitle} lightColor={MetaFitColors.text.primary}>
                {pickerActivo === "inicio" ? "Fecha inicio" : "Fecha fin"}
              </ThemedText>
              <TouchableOpacity onPress={handleAcceptDate} style={styles.iosPickerBtn}>
                <ThemedText style={styles.iosPickerAcceptText} lightColor={MetaFitColors.button.primary}>
                  Aceptar
                </ThemedText>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={tempDate}
              mode="date"
              display="spinner"
              onChange={handlePickerChange}
              maximumDate={pickerActivo === "fin" ? new Date() : fechaFin}
              minimumDate={pickerActivo === "fin" ? fechaInicio : undefined}
              style={styles.iosDatePicker}
            />
          </View>
        )}
        {pickerActivo !== null && Platform.OS === "android" && (
          <DateTimePicker
            value={pickerActivo === "inicio" ? fechaInicio : fechaFin}
            mode="date"
            display="default"
            onChange={handlePickerChange}
            maximumDate={pickerActivo === "fin" ? new Date() : fechaFin}
            minimumDate={pickerActivo === "fin" ? fechaInicio : undefined}
          />
        )}

        {/* Lista de registros */}
        {isLoadingConsumos && (
          <View style={styles.centered}>
            <ActivityIndicator color={MetaFitColors.button.primary} />
            <ThemedText style={styles.loadingText} lightColor={MetaFitColors.text.secondary}>
              Cargando registros...
            </ThemedText>
          </View>
        )}

        {!isLoadingConsumos && buscado && consumos.length === 0 && (
          <View style={styles.emptyCard}>
            <ThemedText style={styles.emptyText} lightColor={MetaFitColors.text.secondary}>
              No se encontraron registros para este rango de fechas.
            </ThemedText>
          </View>
        )}

        {!isLoadingConsumos && consumos.length > 0 && (
          <View style={styles.listaSection}>
            <View style={styles.listaSectionHeader}>
              <ThemedText style={styles.sectionTitle} lightColor={MetaFitColors.text.primary}>
                Registros encontrados
              </ThemedText>
              <View style={styles.headerRight}>
                <View style={styles.countBadge}>
                  <ThemedText style={styles.countText} lightColor={MetaFitColors.text.secondary}>
                    {consumos.length}
                  </ThemedText>
                </View>
                <TouchableOpacity onPress={toggleTodos} activeOpacity={0.7} style={styles.toggleBtn}>
                  <ThemedText style={styles.toggleBtnText} lightColor={MetaFitColors.button.primary}>
                    {seleccionados.size === consumos.length ? "Ninguno" : "Todos"}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>

            {consumos.map((consumo) => {
              const seleccionado = seleccionados.has(consumo.id);
              const tipo = consumo.tipoComida || "Comida";
              const config = TIPO_CONFIG[tipo] ?? TIPO_CONFIG["Comida"];
              const kcal = consumo.energia ? `${Math.round(parseFloat(consumo.energia))} kcal` : "—";
              const fecha = consumo.fechaCreacion
                ? formatDate(new Date(consumo.fechaCreacion))
                : "";

              return (
                <TouchableOpacity
                  key={consumo.id}
                  style={[styles.consumoCard, seleccionado && styles.consumoCardSel]}
                  onPress={() => toggleSeleccion(consumo.id)}
                  activeOpacity={0.7}
                >
                  {/* Checkbox */}
                  <View style={[styles.checkbox, seleccionado && styles.checkboxSel]}>
                    {seleccionado && (
                      <IconSymbol name="checkmark" size={12} color={MetaFitColors.text.white} />
                    )}
                  </View>

                  {/* Tipo badge */}
                  <View style={[styles.tipoBadge, { backgroundColor: config.bg }]}>
                    <ThemedText style={styles.tipoEmoji}>{config.emoji}</ThemedText>
                  </View>

                  {/* Info */}
                  <View style={styles.consumoInfo}>
                    <ThemedText
                      style={styles.consumoNombre}
                      lightColor={MetaFitColors.text.primary}
                      numberOfLines={1}
                    >
                      {consumo.nombre || tipo}
                    </ThemedText>
                    <ThemedText style={styles.consumoMeta} lightColor={MetaFitColors.text.secondary}>
                      {tipo} · {fecha}
                    </ThemedText>
                  </View>

                  {/* Kcal */}
                  <ThemedText style={styles.consumoKcal} lightColor={MetaFitColors.button.primary}>
                    {kcal}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Resultados del análisis */}
        {isAnalizando && (
          <View style={styles.analizandoCard}>
            <ActivityIndicator color={MetaFitColors.button.primary} size="large" />
            <ThemedText style={styles.analizandoText} lightColor={MetaFitColors.text.secondary}>
              Analizando tu patrón alimenticio con IA...
            </ThemedText>
          </View>
        )}

        {errorAnalisis && (
          <View style={styles.errorCard}>
            <ThemedText style={styles.errorText} lightColor={MetaFitColors.error}>
              {errorAnalisis}
            </ThemedText>
          </View>
        )}

        {resultado && !isAnalizando && (
          <View style={styles.resultadoSection}>
            <View style={styles.resultadoHeader}>
              <ThemedText style={styles.resultadoTitle} lightColor={MetaFitColors.text.primary}>
                Resultado del análisis
              </ThemedText>
              <View
                style={[
                  styles.calBadge,
                  { backgroundColor: getCalificacionBadge(resultado.calificacionGeneral).bg },
                ]}
              >
                <ThemedText
                  style={[
                    styles.calBadgeText,
                    { color: getCalificacionBadge(resultado.calificacionGeneral).color },
                  ]}
                >
                  {getCalificacionBadge(resultado.calificacionGeneral).label}
                </ThemedText>
              </View>
            </View>

            {/* Análisis narrativo */}
            <View style={styles.analisisCard}>
              <ThemedText style={styles.analisisTexto} lightColor={MetaFitColors.text.primary}>
                {resultado.analisis}
              </ThemedText>
            </View>

            {/* Puntos fuertes */}
            {resultado.resumen.puntosFuertes.length > 0 && (
              <View style={styles.resumenBloque}>
                <ThemedText style={[styles.resumenBloqueTitle, { color: "#4A9E6B" }]}>
                  Puntos fuertes
                </ThemedText>
                {resultado.resumen.puntosFuertes.map((p, i) => (
                  <View key={i} style={styles.resumenItem}>
                    <View style={[styles.bullet, { backgroundColor: "#4A9E6B" }]} />
                    <ThemedText style={styles.resumenItemText} lightColor={MetaFitColors.text.primary}>
                      {p}
                    </ThemedText>
                  </View>
                ))}
              </View>
            )}

            {/* Puntos débiles */}
            {resultado.resumen.puntosDébiles.length > 0 && (
              <View style={styles.resumenBloque}>
                <ThemedText style={[styles.resumenBloqueTitle, { color: "#C9943A" }]}>
                  Puntos a mejorar
                </ThemedText>
                {resultado.resumen.puntosDébiles.map((p, i) => (
                  <View key={i} style={styles.resumenItem}>
                    <View style={[styles.bullet, { backgroundColor: "#C9943A" }]} />
                    <ThemedText style={styles.resumenItemText} lightColor={MetaFitColors.text.primary}>
                      {p}
                    </ThemedText>
                  </View>
                ))}
              </View>
            )}

            {/* Recomendaciones */}
            {resultado.resumen.recomendaciones.length > 0 && (
              <View style={styles.resumenBloque}>
                <ThemedText style={[styles.resumenBloqueTitle, { color: "#5B96B0" }]}>
                  Recomendaciones
                </ThemedText>
                {resultado.resumen.recomendaciones.map((p, i) => (
                  <View key={i} style={styles.resumenItem}>
                    <View style={[styles.bullet, { backgroundColor: "#5B96B0" }]} />
                    <ThemedText style={styles.resumenItemText} lightColor={MetaFitColors.text.primary}>
                      {p}
                    </ThemedText>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={styles.cerrarBtn}
              onPress={() => setResultado(null)}
              activeOpacity={0.8}
            >
              <ThemedText style={styles.cerrarBtnText} lightColor={MetaFitColors.text.secondary}>
                Cerrar análisis
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Footer fijo */}
      {consumos.length > 0 && (
        <View style={styles.stickyBar}>
          <View style={styles.stickyBarInfo}>
            <ThemedText style={styles.stickyBarKcal} lightColor={MetaFitColors.button.primary}>
              {Math.round(totales.energia)} kcal
            </ThemedText>
            <ThemedText style={styles.stickyBarMacros} lightColor={MetaFitColors.text.secondary}>
              C:{Math.round(totales.carb)}g · P:{Math.round(totales.proteina)}g · G:{Math.round(totales.grasa)}g
            </ThemedText>
            <ThemedText style={styles.stickyBarCount} lightColor={MetaFitColors.text.tertiary}>
              {seleccionados.size} de {consumos.length} seleccionados
            </ThemedText>
          </View>
          <TouchableOpacity
            style={[
              styles.analizarBtn,
              (seleccionados.size === 0 || isAnalizando) && styles.analizarBtnDisabled,
            ]}
            onPress={handleAnalizar}
            disabled={seleccionados.size === 0 || isAnalizando}
            activeOpacity={0.8}
          >
            {isAnalizando ? (
              <ActivityIndicator color={MetaFitColors.text.white} size="small" />
            ) : (
              <>
                <IconSymbol name="sparkles" size={16} color={MetaFitColors.text.white} />
                <ThemedText style={styles.analizarBtnText} lightColor={MetaFitColors.text.white}>
                  Analizar
                </ThemedText>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: MetaFitColors.background.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 140,
  },

  // Header
  pageHeader: {
    marginBottom: 24,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.5,
    lineHeight: 40,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 15,
  },

  // Chips
  chipsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: MetaFitColors.background.card,
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
  },
  chipActivo: {
    backgroundColor: MetaFitColors.button.primary,
    borderColor: MetaFitColors.button.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  chipTextActivo: {
    fontWeight: "700",
  },

  // Date section
  dateSection: {
    gap: 10,
    marginBottom: 24,
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: MetaFitColors.background.card,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
  },
  dateButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
  dateSep: {
    fontSize: 18,
    fontWeight: "300",
  },
  buscarBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: MetaFitColors.button.primary,
    paddingVertical: 12,
    borderRadius: 14,
  },
  buscarBtnText: {
    fontSize: 15,
    fontWeight: "700",
  },

  // iOS Date picker
  iosPickerContainer: {
    backgroundColor: MetaFitColors.background.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
    marginBottom: 16,
    overflow: "hidden",
  },
  iosPickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: MetaFitColors.border.light,
  },
  iosPickerTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  iosPickerBtn: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  iosPickerCancelText: {
    fontSize: 15,
    fontWeight: "500",
  },
  iosPickerAcceptText: {
    fontSize: 15,
    fontWeight: "700",
  },
  iosDatePicker: {
    height: 200,
  },

  // Loading / empty
  centered: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
  },
  emptyCard: {
    backgroundColor: MetaFitColors.background.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
    padding: 24,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },

  // Lista de registros
  listaSection: {
    gap: 10,
  },
  listaSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  countBadge: {
    backgroundColor: MetaFitColors.background.elevated,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countText: {
    fontSize: 12,
    fontWeight: "700",
  },
  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: MetaFitColors.background.elevated,
    borderWidth: 1,
    borderColor: MetaFitColors.border.accent,
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: "700",
  },

  consumoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: MetaFitColors.background.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
    padding: 12,
  },
  consumoCardSel: {
    borderColor: MetaFitColors.border.accent,
    backgroundColor: MetaFitColors.background.elevated,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: MetaFitColors.border.light,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSel: {
    backgroundColor: MetaFitColors.button.primary,
    borderColor: MetaFitColors.button.primary,
  },
  tipoBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  tipoEmoji: {
    fontSize: 18,
  },
  consumoInfo: {
    flex: 1,
    gap: 2,
  },
  consumoNombre: {
    fontSize: 14,
    fontWeight: "700",
  },
  consumoMeta: {
    fontSize: 12,
  },
  consumoKcal: {
    fontSize: 13,
    fontWeight: "800",
  },

  // Analizando
  analizandoCard: {
    alignItems: "center",
    gap: 16,
    paddingVertical: 40,
    marginTop: 16,
  },
  analizandoText: {
    fontSize: 15,
    textAlign: "center",
  },

  // Error
  errorCard: {
    backgroundColor: "#FFF0F0",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F5C6C6",
    padding: 16,
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    lineHeight: 20,
  },

  // Resultados
  resultadoSection: {
    marginTop: 24,
    gap: 14,
  },
  resultadoHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  resultadoTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  calBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  calBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  analisisCard: {
    backgroundColor: MetaFitColors.background.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
    padding: 16,
  },
  analisisTexto: {
    fontSize: 14,
    lineHeight: 22,
  },
  resumenBloque: {
    backgroundColor: MetaFitColors.background.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
    padding: 14,
    gap: 8,
  },
  resumenBloqueTitle: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  resumenItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
    flexShrink: 0,
  },
  resumenItemText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
  },
  cerrarBtn: {
    alignSelf: "center",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
    backgroundColor: MetaFitColors.background.card,
    marginTop: 4,
  },
  cerrarBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },

  // Sticky footer
  stickyBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: MetaFitColors.background.card,
    borderTopWidth: 1,
    borderTopColor: MetaFitColors.border.light,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    gap: 16,
    shadowColor: MetaFitColors.text.primary,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 8,
  },
  stickyBarInfo: {
    flex: 1,
    gap: 2,
  },
  stickyBarKcal: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  stickyBarMacros: {
    fontSize: 12,
    fontWeight: "600",
  },
  stickyBarCount: {
    fontSize: 11,
  },
  analizarBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: MetaFitColors.button.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
  },
  analizarBtnDisabled: {
    opacity: 0.4,
  },
  analizarBtnText: {
    fontSize: 15,
    fontWeight: "700",
  },
});
