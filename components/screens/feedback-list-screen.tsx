import { TablaConsumos } from "@/components/tabla-consumos/TablaConsumos";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ThemedText } from "@/components/ui/themed-text";
import { MetaFitColors } from "@/constants/theme";
import {
  eliminarRegistroComida,
  obtenerConsumosPorFecha,
  obtenerResumenNutricionalDelDia,
  type Consumo,
  type ResumenNutricional,
} from "@/utils/consumos";
import { setPendingImagenUrl } from "@/utils/nav-state";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Calendar, LocaleConfig } from "react-native-calendars";
import { SafeAreaView } from "react-native-safe-area-context";

LocaleConfig.locales["es"] = {
  monthNames: ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"],
  monthNamesShort: ["Ene.","Feb.","Mar.","Abr.","May.","Jun.","Jul.","Ago.","Sep.","Oct.","Nov.","Dic."],
  dayNames: ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"],
  dayNamesShort: ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"],
  today: "Hoy",
};
LocaleConfig.defaultLocale = "es";

function strFromDate(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function dateFromStr(str: string): Date {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

const CALENDAR_THEME = {
  backgroundColor: "transparent",
  calendarBackground: "transparent",
  textSectionTitleColor: MetaFitColors.text.tertiary,
  selectedDayBackgroundColor: MetaFitColors.button.primary,
  selectedDayTextColor: "#fff",
  todayTextColor: MetaFitColors.button.primary,
  todayBackgroundColor: MetaFitColors.background.elevated,
  dayTextColor: MetaFitColors.text.primary,
  textDisabledColor: MetaFitColors.border.light,
  arrowColor: MetaFitColors.button.primary,
  monthTextColor: MetaFitColors.text.primary,
  textMonthFontWeight: "700" as const,
  textMonthFontSize: 15,
  textDayFontSize: 14,
  textDayFontWeight: "500" as const,
  textDayHeaderFontSize: 11,
  textDayHeaderFontWeight: "600" as const,
};

export function FeedbackListScreen() {
  const [consumos, setConsumos] = useState<Consumo[]>([]);
  const [resumen, setResumen] = useState<ResumenNutricional | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showCalendar, setShowCalendar] = useState<boolean>(false);

  const cargarConsumos = useCallback(async () => {
    try {
      setIsLoading(true);
      const [consumosFiltrados, resumenDia] = await Promise.all([
        obtenerConsumosPorFecha(selectedDate),
        obtenerResumenNutricionalDelDia(selectedDate),
      ]);
      setConsumos(consumosFiltrados);
      setResumen(resumenDia);
    } catch (error) {
      console.error("Error al cargar consumos:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  useFocusEffect(
    useCallback(() => {
      cargarConsumos();
    }, [cargarConsumos])
  );

  const handleDayPress = useCallback(({ dateString }: { dateString: string }) => {
    setSelectedDate(dateFromStr(dateString));
    setShowCalendar(false);
  }, []);

  const handlePreviousDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    setSelectedDate(prev);
    setShowCalendar(false);
  };

  const handleNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    if (next <= new Date()) {
      setSelectedDate(next);
      setShowCalendar(false);
    }
  };

  const handleEditar = (consumo: Consumo) => {
    router.push({
      pathname: "/editar-registro",
      params: {
        registroId: consumo.id,
        nombre: consumo.nombre || "",
        cantidad: consumo.cantidad || "",
        energia: consumo.energia || "",
        carb: consumo.carb || "",
        proteina: consumo.proteina || "",
        fibra: consumo.fibra || "",
        grasa: consumo.grasa || "",
        tipoComida: consumo.tipoComida || "",
        ingredientesJson: consumo.ingredientes && consumo.ingredientes.length > 0
          ? JSON.stringify(consumo.ingredientes)
          : "",
      },
    });
  };

  const handleReagregar = (consumo: Consumo) => {
    setPendingImagenUrl(consumo.imagenUrl || null);
    router.push({
      pathname: "/reagregar-comida",
      params: {
        nombre: consumo.nombre || "",
        cantidad: consumo.cantidad || "",
        energia: consumo.energia || "",
        carb: consumo.carb || "",
        proteina: consumo.proteina || "",
        fibra: consumo.fibra || "",
        grasa: consumo.grasa || "",
        tipoComida: consumo.tipoComida || "",
        ingredientesJson: consumo.ingredientes && consumo.ingredientes.length > 0
          ? JSON.stringify(consumo.ingredientes)
          : "",
      },
    });
  };

  const handleEliminar = async (id: string) => {
    try {
      await eliminarRegistroComida(id);
      await cargarConsumos();
    } catch (error: any) {
      Alert.alert("Error", `No se pudo eliminar: ${error.message || "Error desconocido"}`);
    }
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const formatDateLabel = (date: Date): string => {
    if (isToday(date)) return "Hoy";
    const meses = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
    const hoy = new Date();
    const ayer = new Date(hoy);
    ayer.setDate(hoy.getDate() - 1);
    const esAyer =
      date.getDate() === ayer.getDate() &&
      date.getMonth() === ayer.getMonth() &&
      date.getFullYear() === ayer.getFullYear();
    if (esAyer) return "Ayer";
    if (date.getFullYear() === hoy.getFullYear()) {
      return `${date.getDate()} ${meses[date.getMonth()]}`;
    }
    return `${date.getDate()} ${meses[date.getMonth()]} ${date.getFullYear()}`;
  };

  const roundMacro = (val: number) => Math.round(val);
  const todayStr = strFromDate(new Date());
  const selectedStr = strFromDate(selectedDate);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.pageHeader}>
          <View style={styles.pageTitleRow}>
            <ThemedText style={styles.pageTitle} lightColor={MetaFitColors.text.primary}>
              Historial
            </ThemedText>
            <TouchableOpacity
              style={styles.exportIconButton}
              onPress={() => router.push("/exportar-historial")}
              activeOpacity={0.7}
            >
              <IconSymbol name="arrow.down.doc" size={18} color={MetaFitColors.button.primary} />
            </TouchableOpacity>
          </View>
          <ThemedText style={styles.pageSubtitle} lightColor={MetaFitColors.text.secondary}>
            Revisa tus consumos por fecha
          </ThemedText>
        </View>

        {/* ── Date navigation ── */}
        <View style={styles.dateSection}>
          <View style={styles.dateNavRow}>
            {/* Previous day */}
            <TouchableOpacity style={styles.navArrow} onPress={handlePreviousDay} activeOpacity={0.7}>
              <IconSymbol name="chevron.left" size={18} color={MetaFitColors.button.primary} />
            </TouchableOpacity>

            {/* Date toggle button */}
            <TouchableOpacity
              style={[styles.dateButton, showCalendar && styles.dateButtonActive]}
              onPress={() => setShowCalendar((v) => !v)}
              activeOpacity={0.8}
            >
              <IconSymbol name="calendar" size={16} color={MetaFitColors.button.primary} />
              <ThemedText style={styles.dateButtonText} lightColor={MetaFitColors.text.primary}>
                {formatDateLabel(selectedDate)}
              </ThemedText>
              <IconSymbol
                name={showCalendar ? "chevron.up" : "chevron.down"}
                size={13}
                color={MetaFitColors.text.tertiary}
              />
            </TouchableOpacity>

            {/* Next day */}
            <TouchableOpacity
              style={[styles.navArrow, isToday(selectedDate) && styles.navArrowDisabled]}
              onPress={handleNextDay}
              activeOpacity={0.7}
              disabled={isToday(selectedDate)}
            >
              <IconSymbol
                name="chevron.right"
                size={18}
                color={isToday(selectedDate) ? MetaFitColors.text.tertiary : MetaFitColors.button.primary}
              />
            </TouchableOpacity>
          </View>

          {/* ── Inline calendar ── */}
          {showCalendar && (
            <View style={styles.calendarCard}>
              <Calendar
                current={selectedStr}
                onDayPress={handleDayPress}
                maxDate={todayStr}
                markedDates={{
                  [selectedStr]: {
                    selected: true,
                    selectedColor: MetaFitColors.button.primary,
                  },
                }}
                enableSwipeMonths
                theme={CALENDAR_THEME}
              />
            </View>
          )}
        </View>

        {/* ── Macro summary card ── */}
        {!isLoading && resumen && resumen.totalRegistros > 0 && (
          <View style={styles.macroCard}>
            <ThemedText style={styles.macroCardTitle} lightColor={MetaFitColors.text.secondary}>
              Resumen nutricional
            </ThemedText>
            <View style={styles.macroRow}>
              <View style={styles.macroItem}>
                <ThemedText style={styles.macroValue} lightColor={MetaFitColors.button.primary}>
                  {roundMacro(resumen.energia)}
                </ThemedText>
                <ThemedText style={styles.macroLabel} lightColor={MetaFitColors.text.secondary}>kcal</ThemedText>
              </View>
              <View style={styles.macroDivider} />
              <View style={styles.macroItem}>
                <ThemedText style={styles.macroValue} lightColor={MetaFitColors.text.primary}>
                  {roundMacro(resumen.carb)}g
                </ThemedText>
                <ThemedText style={styles.macroLabel} lightColor={MetaFitColors.text.secondary}>Carbos</ThemedText>
              </View>
              <View style={styles.macroDivider} />
              <View style={styles.macroItem}>
                <ThemedText style={styles.macroValue} lightColor={MetaFitColors.text.primary}>
                  {roundMacro(resumen.proteina)}g
                </ThemedText>
                <ThemedText style={styles.macroLabel} lightColor={MetaFitColors.text.secondary}>Proteína</ThemedText>
              </View>
              <View style={styles.macroDivider} />
              <View style={styles.macroItem}>
                <ThemedText style={styles.macroValue} lightColor={MetaFitColors.text.primary}>
                  {roundMacro(resumen.grasa)}g
                </ThemedText>
                <ThemedText style={styles.macroLabel} lightColor={MetaFitColors.text.secondary}>Grasa</ThemedText>
              </View>
            </View>
          </View>
        )}

        {/* ── Consumos section ── */}
        <View style={styles.consumosSection}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle} lightColor={MetaFitColors.text.primary}>
              {isToday(selectedDate) ? "Consumos de hoy" : `Consumos del ${formatDateLabel(selectedDate)}`}
            </ThemedText>
            {consumos.length > 0 && (
              <View style={styles.countBadge}>
                <ThemedText style={styles.countText} lightColor={MetaFitColors.text.secondary}>
                  {consumos.length}
                </ThemedText>
              </View>
            )}
          </View>

          <TablaConsumos
            consumos={consumos}
            isLoading={isLoading}
            fechaSeleccionada={selectedDate}
            onAgregarComida={() => router.push({ pathname: "/registro-comida", params: { fecha: selectedDate.toISOString() } })}
            onEditar={handleEditar}
            onEliminar={handleEliminar}
            onReagregar={handleReagregar}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MetaFitColors.background.white,
  },
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 110,
  },

  // ── Header ──
  pageHeader: { marginBottom: 24 },
  pageTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  exportIconButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: MetaFitColors.background.elevated,
    borderWidth: 1,
    borderColor: MetaFitColors.border.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.5,
    lineHeight: 40,
    marginBottom: 4,
  },
  pageSubtitle: { fontSize: 15 },

  // ── Date section ──
  dateSection: {
    marginBottom: 16,
    gap: 10,
  },
  dateNavRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  navArrow: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: MetaFitColors.background.card,
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
    alignItems: "center",
    justifyContent: "center",
  },
  navArrowDisabled: { opacity: 0.35 },
  dateButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: MetaFitColors.background.card,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
  },
  dateButtonActive: {
    borderColor: MetaFitColors.button.primary,
    borderWidth: 1.5,
  },
  dateButtonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.2,
  },

  // ── Calendar card ──
  calendarCard: {
    backgroundColor: MetaFitColors.background.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
    overflow: "hidden",
    paddingBottom: 6,
  },

  // ── Macro summary ──
  macroCard: {
    backgroundColor: MetaFitColors.background.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  macroCardTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  macroRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  macroItem: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  macroDivider: {
    width: 1,
    height: 32,
    backgroundColor: MetaFitColors.border.light,
  },
  macroValue: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  macroLabel: {
    fontSize: 11,
    fontWeight: "500",
  },

  // ── Consumos section ──
  consumosSection: { flex: 1 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    flex: 1,
    letterSpacing: -0.2,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: MetaFitColors.background.card,
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
  },
  countText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
