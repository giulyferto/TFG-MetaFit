import { IconSymbol } from "@/components/ui/icon-symbol";
import { ThemedText } from "@/components/ui/themed-text";
import { MetaFitColors } from "@/constants/theme";
import { obtenerConsumosPorRango, type Consumo } from "@/utils/consumos";
import { getNutritionalProfile } from "@/utils/nutritional-profile";
import { analizarPatronAlimenticio, type AnalizarPatronResponse } from "@/utils/openai";
import { Image } from "expo-image";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
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

const MESES = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];

const TIPO_CONFIG: Record<string, { emoji: string; color: string; bg: string }> = {
  Desayuno: { emoji: "☀️", color: "#C9943A", bg: "#FFF8EC" },
  Almuerzo: { emoji: "🌿", color: "#4A9E6B", bg: "#F0FAF4" },
  Merienda: { emoji: "🫐", color: "#7B6FD4", bg: "#F3F1FD" },
  Cena:     { emoji: "🌙", color: "#5B96B0", bg: "#EEF5F9" },
  Snack:    { emoji: "🍎", color: "#C94848", bg: "#FFF0F0" },
  Comida:   { emoji: "🍽️", color: "#6B7C8D", bg: "#F5F5F5" },
};

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

const QUICK_RANGES = [
  { label: "Hoy",    days: 0 },
  { label: "7 días", days: 6 },
  { label: "30 días",days: 29 },
];

function getCalificacionBadge(cal: "Muy saludable" | "Equilibrada" | "Poco nutritiva") {
  if (cal === "Muy saludable") return { bg: "#F0FAF4", color: "#4A9E6B", label: "Muy saludable", score: 90 };
  if (cal === "Poco nutritiva") return { bg: "#FFF0F0", color: "#C94848", label: "Poco nutritiva", score: 30 };
  return { bg: "#FFF8EC", color: "#C9943A", label: "Equilibrada", score: 65 };
}

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

function formatDate(date: Date): string {
  return `${date.getDate().toString().padStart(2,"0")}/${(date.getMonth()+1).toString().padStart(2,"0")}/${date.getFullYear()}`;
}

function startOfDay(date: Date): Date {
  const d = new Date(date); d.setHours(0, 0, 0, 0); return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date); d.setHours(23, 59, 59, 999); return d;
}

function daysAgo(n: number): Date {
  const d = new Date(); d.setDate(d.getDate() - n); return d;
}

function diffDays(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

function isToday(date: Date): boolean {
  const t = new Date();
  return date.getDate() === t.getDate() && date.getMonth() === t.getMonth() && date.getFullYear() === t.getFullYear();
}

function isYesterday(date: Date): boolean {
  const y = daysAgo(1);
  return date.getDate() === y.getDate() && date.getMonth() === y.getMonth() && date.getFullYear() === y.getFullYear();
}

function formatShortDate(date: Date): string {
  return `${date.getDate()} ${MESES[date.getMonth()]}`;
}

/** Build markedDates for react-native-calendars period marking */
function buildMarkedDates(start: Date, end: Date) {
  const marks: Record<string, any> = {};
  const primary = MetaFitColors.button.primary;
  const fill = "#B8D4E0";
  const startStr = strFromDate(start);
  const endStr = strFromDate(end);

  if (startStr === endStr) {
    marks[startStr] = { color: primary, textColor: "#fff", startingDay: true, endingDay: true };
    return marks;
  }

  const cur = new Date(start);
  while (cur <= end) {
    const s = strFromDate(cur);
    const isStart = s === startStr;
    const isEnd = s === endStr;
    marks[s] = {
      color: isStart || isEnd ? primary : fill,
      textColor: isStart || isEnd ? "#fff" : MetaFitColors.text.primary,
      startingDay: isStart,
      endingDay: isEnd,
    };
    cur.setDate(cur.getDate() + 1);
  }
  return marks;
}

function MacroPropBar({ carb, proteina, grasa, height = 4 }: { carb: number; proteina: number; grasa: number; height?: number }) {
  const cCal = carb * 4, pCal = proteina * 4, gCal = grasa * 9;
  const total = cCal + pCal + gCal;
  if (total === 0) return null;
  return (
    <View style={{ flexDirection: "row", height, borderRadius: 2, overflow: "hidden", gap: 1.5 }}>
      <View style={{ flex: pCal / total, backgroundColor: "#E8636A" }} />
      <View style={{ flex: cCal / total, backgroundColor: "#E8A542" }} />
      <View style={{ flex: gCal / total, backgroundColor: MetaFitColors.button.primary }} />
    </View>
  );
}

export function AnalisisScreen() {
  const scrollViewRef = useRef<ScrollView>(null);

  const today = new Date();
  const [rangeStart, setRangeStart] = useState<Date>(today);
  const [rangeEnd, setRangeEnd]     = useState<Date>(today);
  const [selPhase, setSelPhase]     = useState<"start" | "end">("start");
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarKey, setCalendarKey] = useState(() => `${strFromDate(today)}-0`);
  const [activeQuickDays, setActiveQuickDays] = useState<number | null>(0);

  const [consumos, setConsumos]               = useState<Consumo[]>([]);
  const [isLoadingConsumos, setIsLoadingConsumos] = useState(false);
  const [buscado, setBuscado]                 = useState(false);

  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [isAnalizando, setIsAnalizando]   = useState(false);
  const [resultado, setResultado]         = useState<AnalizarPatronResponse | null>(null);
  const [errorAnalisis, setErrorAnalisis] = useState<string | null>(null);

  // ── Range selection ──────────────────────────────────────────────────
  const applyQuickRange = (daysBack: number) => {
    const end = new Date();
    const start = daysBack === 0 ? new Date() : daysAgo(daysBack);
    setRangeStart(start);
    setRangeEnd(end);
    setSelPhase("start");
    setActiveQuickDays(daysBack);
    setCalendarKey(`${strFromDate(end)}-${Date.now()}`); // always unique → always remounts at end month
  };

  const handleCalendarDayPress = useCallback(({ dateString }: { dateString: string }) => {
    const date = dateFromStr(dateString);
    if (selPhase === "start") {
      setRangeStart(date);
      setRangeEnd(date);
      setSelPhase("end");
      setActiveQuickDays(null); // manual selection clears chip highlight
    } else {
      if (date < rangeStart) {
        setRangeStart(date);
        setRangeEnd(date);
        // stay in "end" phase so user picks end next
      } else {
        setRangeEnd(date);
        setSelPhase("start");
        // navigate to the month of the end date so the full range is visible
        setCalendarKey(`${dateString}-${Date.now()}`);
      }
    }
  }, [selPhase, rangeStart]);

  // ── Data loading ─────────────────────────────────────────────────────
  const cargarConsumos = useCallback(async () => {
    setIsLoadingConsumos(true);
    setResultado(null);
    setErrorAnalisis(null);
    try {
      const data = await obtenerConsumosPorRango(startOfDay(rangeStart), endOfDay(rangeEnd));
      setConsumos(data);
      setSeleccionados(new Set(data.map((c) => c.id)));
      setBuscado(true);
    } catch {
      setConsumos([]);
    } finally {
      setIsLoadingConsumos(false);
    }
  }, [rangeStart, rangeEnd]);

  const toggleSeleccion = (id: string) => {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleTodos = () => {
    if (seleccionados.size === consumos.length) setSeleccionados(new Set());
    else setSeleccionados(new Set(consumos.map((c) => c.id)));
  };

  const consumosSeleccionados = consumos.filter((c) => seleccionados.has(c.id));

  const totales = consumosSeleccionados.reduce(
    (acc, c) => ({
      energia:  acc.energia  + parseFloat(c.energia  || "0"),
      carb:     acc.carb     + parseFloat(c.carb     || "0"),
      proteina: acc.proteina + parseFloat(c.proteina || "0"),
      grasa:    acc.grasa    + parseFloat(c.grasa    || "0"),
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
      const rangoStr = `${formatDate(rangeStart)} – ${formatDate(rangeEnd)}`;
      const data = await analizarPatronAlimenticio(consumosSeleccionados, rangoStr, perfil ?? undefined);
      setResultado(data);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 200);
    } catch (err: any) {
      setErrorAnalisis(err.message || "Error al analizar");
    } finally {
      setIsAnalizando(false);
    }
  };

  // ── Derived display values ───────────────────────────────────────────
  const todayStr   = strFromDate(new Date());
  const numDias    = diffDays(rangeStart, rangeEnd);
  const isRango    = numDias > 1;
  const markedDates = buildMarkedDates(rangeStart, rangeEnd);

  // Date display label
  const startSameAsEnd = strFromDate(rangeStart) === strFromDate(rangeEnd);
  let dateLabel: string;
  let dateSub: string | null = null;

  if (startSameAsEnd) {
    if (isToday(rangeStart))     { dateLabel = "Hoy";  dateSub = formatShortDate(rangeStart); }
    else if (isYesterday(rangeStart)) { dateLabel = "Ayer"; dateSub = formatShortDate(rangeStart); }
    else { dateLabel = formatShortDate(rangeStart); dateSub = String(rangeStart.getFullYear()); }
  } else {
    dateLabel = `${formatShortDate(rangeStart)}  —  ${formatShortDate(rangeEnd)}`;
    dateSub   = `${numDias} días`;
  }

  // Footer smart values
  const avgKcal = isRango && numDias > 0 ? totales.energia / numDias : totales.energia;
  const avgCarb = isRango && numDias > 0 ? totales.carb / numDias : totales.carb;
  const avgProt = isRango && numDias > 0 ? totales.proteina / numDias : totales.proteina;
  const avgGras = isRango && numDias > 0 ? totales.grasa / numDias : totales.grasa;

  // Phase hint
  const phaseHint = selPhase === "start"
    ? "Toca para seleccionar inicio del período"
    : "Ahora selecciona el fin del período";

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.pageHeader}>
          <ThemedText style={styles.pageTitle} lightColor={MetaFitColors.text.primary}>
            Análisis
          </ThemedText>
          <ThemedText style={styles.pageSubtitle} lightColor={MetaFitColors.text.secondary}>
            Selecciona un período y analiza tus hábitos
          </ThemedText>
        </View>

        {/* ── Date picker — unified card ── */}
        <View style={styles.pickerContainer}>
          {/* Tappable header */}
          <TouchableOpacity
            style={styles.pickerHeader}
            onPress={() => setShowCalendar((v) => !v)}
            activeOpacity={0.7}
          >
            <View style={styles.dateRangeLeft}>
              <ThemedText style={styles.dateRangeMain} lightColor={MetaFitColors.text.primary}>
                {dateLabel}
              </ThemedText>
              {dateSub && (
                <ThemedText style={styles.dateRangeSub} lightColor={MetaFitColors.text.secondary}>
                  {dateSub}
                </ThemedText>
              )}
            </View>
            <View style={styles.dateRangeToggle}>
              <IconSymbol
                name={showCalendar ? "chevron.up" : "chevron.down"}
                size={14}
                color={MetaFitColors.button.primary}
              />
            </View>
          </TouchableOpacity>

          {/* Expandable body — same card, no seam */}
          {showCalendar && (
            <>
              <View style={styles.pickerDivider} />

              {/* Quick range chips */}
              <View style={styles.quickChips}>
                {QUICK_RANGES.map((q) => {
                  const isActive = activeQuickDays === q.days;
                  return (
                    <TouchableOpacity
                      key={q.label}
                      style={[styles.quickChip, isActive && styles.quickChipActive]}
                      onPress={() => applyQuickRange(q.days)}
                      activeOpacity={0.75}
                    >
                      <ThemedText
                        style={[styles.quickChipText, isActive && styles.quickChipTextActive]}
                        lightColor={isActive ? "#fff" : MetaFitColors.text.secondary}
                      >
                        {q.label}
                      </ThemedText>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Phase hint */}
              <View style={styles.phaseHintRow}>
                <View style={[styles.phaseDot, selPhase === "end" && styles.phaseDotActive]} />
                <ThemedText style={styles.phaseHintText} lightColor={MetaFitColors.text.tertiary}>
                  {phaseHint}
                </ThemedText>
              </View>

              <Calendar
                key={calendarKey}
                current={strFromDate(rangeEnd)}
                onDayPress={handleCalendarDayPress}
                maxDate={todayStr}
                markingType="period"
                markedDates={markedDates}
                enableSwipeMonths
                theme={CALENDAR_THEME}
              />
            </>
          )}
        </View>

        {/* ── Search button ── */}
        <TouchableOpacity
          style={styles.buscarBtn}
          onPress={() => { setShowCalendar(false); cargarConsumos(); }}
          activeOpacity={0.8}
        >
          <IconSymbol name="magnifyingglass" size={15} color="#fff" />
          <ThemedText style={styles.buscarBtnText} lightColor="#fff">
            Buscar registros
          </ThemedText>
        </TouchableOpacity>

        {/* ── Loading ── */}
        {isLoadingConsumos && (
          <View style={styles.centered}>
            <ActivityIndicator color={MetaFitColors.button.primary} />
            <ThemedText style={styles.loadingText} lightColor={MetaFitColors.text.secondary}>
              Cargando registros...
            </ThemedText>
          </View>
        )}

        {/* ── Empty ── */}
        {!isLoadingConsumos && buscado && consumos.length === 0 && (
          <View style={styles.emptyCard}>
            <ThemedText style={styles.emptyEmoji}>🥗</ThemedText>
            <ThemedText style={styles.emptyTitle} lightColor={MetaFitColors.text.primary}>
              Sin registros
            </ThemedText>
            <ThemedText style={styles.emptySubtitle} lightColor={MetaFitColors.text.secondary}>
              No encontramos comidas para este período
            </ThemedText>
          </View>
        )}

        {/* ── Consumption List ── */}
        {!isLoadingConsumos && consumos.length > 0 && (
          <View style={styles.listaSection}>
            <View style={styles.listaSectionHeader}>
              <View style={styles.listaHeaderLeft}>
                <ThemedText style={styles.sectionTitle} lightColor={MetaFitColors.text.primary}>
                  Registros
                </ThemedText>
                <View style={styles.countPill}>
                  <ThemedText style={styles.countPillText} lightColor={MetaFitColors.text.secondary}>
                    {consumos.length}
                  </ThemedText>
                </View>
              </View>
              <TouchableOpacity onPress={toggleTodos} activeOpacity={0.7}>
                <ThemedText style={styles.toggleAllText} lightColor={MetaFitColors.button.primary}>
                  {seleccionados.size === consumos.length ? "Ninguno" : "Todos"}
                </ThemedText>
              </TouchableOpacity>
            </View>

            <View style={styles.cardsList}>
              {consumos.map((consumo, index) => {
                const isLast = index === consumos.length - 1;
                const seleccionado = seleccionados.has(consumo.id);
                const tipo = consumo.tipoComida || "Comida";
                const config = TIPO_CONFIG[tipo] ?? TIPO_CONFIG["Comida"];
                const kcal = consumo.energia ? Math.round(parseFloat(consumo.energia)) : null;
                const fecha = consumo.fechaCreacion
                  ? formatShortDate(new Date(consumo.fechaCreacion))
                  : "";

                return (
                  <TouchableOpacity
                    key={consumo.id}
                    style={[
                      styles.consumoCard,
                      seleccionado && styles.consumoCardSel,
                      !isLast && styles.consumoCardDivider,
                    ]}
                    onPress={() => toggleSeleccion(consumo.id)}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.typeAccent, { backgroundColor: config.color }]} />
                    {consumo.imagenUrl ? (
                      <Image source={{ uri: consumo.imagenUrl }} style={styles.consumoThumb} contentFit="cover" />
                    ) : (
                      <View style={[styles.consumoEmojiWrap, { backgroundColor: config.bg }]}>
                        <ThemedText style={styles.consumoEmoji}>{config.emoji}</ThemedText>
                      </View>
                    )}
                    <View style={styles.consumoInfo}>
                      <ThemedText style={styles.consumoNombre} lightColor={MetaFitColors.text.primary} numberOfLines={1}>
                        {consumo.nombre || tipo}
                      </ThemedText>
                      <ThemedText style={styles.consumoMeta} lightColor={MetaFitColors.text.tertiary}>
                        {tipo}  ·  {fecha}
                      </ThemedText>
                    </View>
                    <View style={styles.consumoRight}>
                      {kcal !== null && (
                        <Text style={styles.consumoKcal}>
                          <Text style={{ color: MetaFitColors.button.primary }}>{kcal}</Text>
                          <Text style={styles.consumoKcalUnit}> kcal</Text>
                        </Text>
                      )}
                      <View style={[styles.checkbox, seleccionado && styles.checkboxSel]}>
                        {seleccionado && <IconSymbol name="checkmark" size={11} color="#fff" />}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* ── Analizando ── */}
        {isAnalizando && (
          <View style={styles.analizandoCard}>
            <ActivityIndicator color={MetaFitColors.button.primary} size="large" />
            <ThemedText style={styles.analizandoText} lightColor={MetaFitColors.text.secondary}>
              Analizando tus hábitos con IA...
            </ThemedText>
          </View>
        )}

        {/* ── Error ── */}
        {errorAnalisis && (
          <View style={styles.errorCard}>
            <ThemedText style={styles.errorText} lightColor={MetaFitColors.error}>{errorAnalisis}</ThemedText>
          </View>
        )}

        {/* ── Resultado ── */}
        {resultado && !isAnalizando && (
          <View style={styles.resultadoSection}>
            {(() => {
              const badge = getCalificacionBadge(resultado.calificacionGeneral);
              return (
                <View style={[styles.calHeader, { backgroundColor: badge.bg }]}>
                  <View style={styles.calHeaderLeft}>
                    <ThemedText style={styles.calHeaderLabel} lightColor={MetaFitColors.text.secondary}>
                      Calificación general
                    </ThemedText>
                    <ThemedText style={[styles.calHeaderValue, { color: badge.color }]}>
                      {badge.label}
                    </ThemedText>
                  </View>
                  <View style={[styles.calScoreBadge, { borderColor: badge.color + "44" }]}>
                    <Text style={[styles.calScoreNumber, { color: badge.color }]}>{badge.score}</Text>
                    <Text style={styles.calScoreMax}>/100</Text>
                  </View>
                </View>
              );
            })()}

            <View style={styles.analisisCard}>
              <Text style={styles.analisisQuoteChar}>"</Text>
              <ThemedText style={styles.analisisTexto} lightColor={MetaFitColors.text.primary}>
                {resultado.analisis}
              </ThemedText>
            </View>

            {resultado.resumen.puntosFuertes.length > 0 && (
              <View style={styles.resumenBloque}>
                <View style={[styles.resumenBloqueHeader, { borderLeftColor: "#4A9E6B" }]}>
                  <ThemedText style={[styles.resumenBloqueTitle, { color: "#4A9E6B" }]}>Puntos fuertes</ThemedText>
                </View>
                {resultado.resumen.puntosFuertes.map((p, i) => (
                  <View key={i} style={styles.resumenItem}>
                    <View style={[styles.bullet, { backgroundColor: "#4A9E6B" }]} />
                    <ThemedText style={styles.resumenItemText} lightColor={MetaFitColors.text.primary}>{p}</ThemedText>
                  </View>
                ))}
              </View>
            )}

            {resultado.resumen.puntosDébiles.length > 0 && (
              <View style={styles.resumenBloque}>
                <View style={[styles.resumenBloqueHeader, { borderLeftColor: "#C9943A" }]}>
                  <ThemedText style={[styles.resumenBloqueTitle, { color: "#C9943A" }]}>A mejorar</ThemedText>
                </View>
                {resultado.resumen.puntosDébiles.map((p, i) => (
                  <View key={i} style={styles.resumenItem}>
                    <View style={[styles.bullet, { backgroundColor: "#C9943A" }]} />
                    <ThemedText style={styles.resumenItemText} lightColor={MetaFitColors.text.primary}>{p}</ThemedText>
                  </View>
                ))}
              </View>
            )}

            {resultado.resumen.recomendaciones.length > 0 && (
              <View style={styles.resumenBloque}>
                <View style={[styles.resumenBloqueHeader, { borderLeftColor: MetaFitColors.button.primary }]}>
                  <ThemedText style={[styles.resumenBloqueTitle, { color: MetaFitColors.button.primary }]}>Recomendaciones</ThemedText>
                </View>
                {resultado.resumen.recomendaciones.map((p, i) => (
                  <View key={i} style={styles.resumenItem}>
                    <View style={[styles.bullet, { backgroundColor: MetaFitColors.button.primary }]} />
                    <ThemedText style={styles.resumenItemText} lightColor={MetaFitColors.text.primary}>{p}</ThemedText>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity style={styles.cerrarBtn} onPress={() => setResultado(null)} activeOpacity={0.8}>
              <ThemedText style={styles.cerrarBtnText} lightColor={MetaFitColors.text.secondary}>
                Cerrar análisis
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* ── Smart Sticky Footer ── */}
      {consumos.length > 0 && (
        <View style={styles.stickyBar}>
          <View style={styles.stickyBarInfo}>
            <MacroPropBar carb={avgCarb} proteina={avgProt} grasa={avgGras} />
            <View style={styles.stickyBarRow}>
              <ThemedText style={styles.stickyBarKcal} lightColor={MetaFitColors.button.primary}>
                {isRango
                  ? `~${Math.round(avgKcal)} kcal/día`
                  : `${Math.round(totales.energia)} kcal`}
              </ThemedText>
              {isRango && (
                <View style={styles.stickyRangePill}>
                  <ThemedText style={styles.stickyRangePillText} lightColor={MetaFitColors.button.primary}>
                    {numDias} días
                  </ThemedText>
                </View>
              )}
            </View>
            <ThemedText style={styles.stickyBarMacros} lightColor={MetaFitColors.text.secondary}>
              {isRango ? "Promedio · " : ""}
              P {Math.round(avgProt)}g · C {Math.round(avgCarb)}g · G {Math.round(avgGras)}g
            </ThemedText>
            <ThemedText style={styles.stickyBarCount} lightColor={MetaFitColors.text.tertiary}>
              {seleccionados.size} de {consumos.length} registros seleccionados
            </ThemedText>
          </View>
          <TouchableOpacity
            style={[styles.analizarBtn, (seleccionados.size === 0 || isAnalizando) && styles.analizarBtnDisabled]}
            onPress={handleAnalizar}
            disabled={seleccionados.size === 0 || isAnalizando}
            activeOpacity={0.8}
          >
            {isAnalizando ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <IconSymbol name="sparkles" size={16} color="#fff" />
                <ThemedText style={styles.analizarBtnText} lightColor="#fff">Analizar</ThemedText>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: MetaFitColors.background.white },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 160 },

  // ── Header ──
  pageHeader: { marginBottom: 20 },
  pageTitle: { fontSize: 34, fontWeight: "800", letterSpacing: -0.8, lineHeight: 42, marginBottom: 2 },
  pageSubtitle: { fontSize: 14 },

  // ── Unified date picker card ──
  pickerContainer: {
    backgroundColor: MetaFitColors.background.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
    marginBottom: 10,
    overflow: "hidden",
  },
  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  pickerDivider: {
    height: 1,
    backgroundColor: MetaFitColors.border.divider,
  },
  dateRangeLeft: { flex: 1, gap: 2 },
  dateRangeMain: { fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  dateRangeSub:  { fontSize: 13, fontWeight: "500" },
  dateRangeToggle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: MetaFitColors.background.elevated,
    alignItems: "center",
    justifyContent: "center",
  },

  // Quick chips
  quickChips: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
  },
  quickChip: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: MetaFitColors.background.elevated,
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
  },
  quickChipActive: {
    backgroundColor: MetaFitColors.button.primary,
    borderColor: MetaFitColors.button.primary,
  },
  quickChipText: { fontSize: 12, fontWeight: "600" },
  quickChipTextActive: { color: "#fff" },

  // Phase hint
  phaseHintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  phaseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: MetaFitColors.border.accent,
  },
  phaseDotActive: {
    backgroundColor: MetaFitColors.button.primary,
  },
  phaseHintText: { fontSize: 12, fontWeight: "500" },

  // ── Search button ──
  buscarBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: MetaFitColors.button.primary,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 24,
    shadowColor: MetaFitColors.button.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 3,
  },
  buscarBtnText: { fontSize: 15, fontWeight: "700" },

  // ── Loading / Empty ──
  centered: { alignItems: "center", paddingVertical: 40, gap: 12 },
  loadingText: { fontSize: 15 },
  emptyCard: {
    backgroundColor: MetaFitColors.background.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
    padding: 36,
    alignItems: "center",
    gap: 8,
  },
  emptyEmoji: { fontSize: 40, lineHeight: 52 },
  emptyTitle: { fontSize: 17, fontWeight: "700", marginTop: 4 },
  emptySubtitle: { fontSize: 14, textAlign: "center", lineHeight: 20 },

  // ── Lista ──
  listaSection: { gap: 12, marginBottom: 16 },
  listaSectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  listaHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { fontSize: 17, fontWeight: "700", letterSpacing: -0.3 },
  countPill: {
    backgroundColor: MetaFitColors.background.elevated,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
  },
  countPillText: { fontSize: 12, fontWeight: "700" },
  toggleAllText: { fontSize: 13, fontWeight: "700" },

  cardsList: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
    overflow: "hidden",
    backgroundColor: MetaFitColors.background.card,
  },
  consumoCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 14,
    paddingVertical: 12,
    backgroundColor: MetaFitColors.background.card,
  },
  consumoCardSel: { backgroundColor: MetaFitColors.background.elevated },
  consumoCardDivider: { borderBottomWidth: 1, borderBottomColor: MetaFitColors.border.divider },
  typeAccent: { width: 4, alignSelf: "stretch", marginRight: 10, flexShrink: 0 },
  consumoThumb: { width: 42, height: 42, borderRadius: 10, flexShrink: 0, marginRight: 10 },
  consumoEmojiWrap: {
    width: 42, height: 42, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0, marginRight: 10,
  },
  consumoEmoji: { fontSize: 20 },
  consumoInfo: { flex: 1, gap: 2, marginRight: 10 },
  consumoNombre: { fontSize: 14, fontWeight: "700", letterSpacing: -0.1 },
  consumoMeta: { fontSize: 12, fontWeight: "500" },
  consumoRight: { alignItems: "flex-end", gap: 6, flexShrink: 0 },
  consumoKcal: { fontSize: 13, fontWeight: "800", letterSpacing: -0.2 },
  consumoKcalUnit: { fontSize: 10, fontWeight: "500", color: MetaFitColors.text.tertiary },
  checkbox: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 1.5, borderColor: MetaFitColors.border.light,
    alignItems: "center", justifyContent: "center",
  },
  checkboxSel: { backgroundColor: MetaFitColors.button.primary, borderColor: MetaFitColors.button.primary },

  // ── Analizando ──
  analizandoCard: { alignItems: "center", gap: 16, paddingVertical: 40, marginTop: 16 },
  analizandoText: { fontSize: 15, textAlign: "center", lineHeight: 22 },

  // ── Error ──
  errorCard: {
    backgroundColor: "#FFF0F0", borderRadius: 14,
    borderWidth: 1, borderColor: "#F5C6C6", padding: 16, marginTop: 16,
  },
  errorText: { fontSize: 14, lineHeight: 20 },

  // ── Resultado ──
  resultadoSection: { marginTop: 8, gap: 12 },
  calHeader: { borderRadius: 16, padding: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  calHeaderLeft: { gap: 4 },
  calHeaderLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.6, textTransform: "uppercase" },
  calHeaderValue: { fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  calScoreBadge: {
    flexDirection: "row", alignItems: "baseline",
    borderWidth: 1.5, borderRadius: 14,
    paddingHorizontal: 12, paddingVertical: 8, gap: 1,
  },
  calScoreNumber: { fontSize: 26, fontWeight: "900", letterSpacing: -0.5 },
  calScoreMax: { fontSize: 12, fontWeight: "600", color: MetaFitColors.text.tertiary },
  analisisCard: {
    backgroundColor: MetaFitColors.background.card,
    borderRadius: 16, borderWidth: 1, borderColor: MetaFitColors.border.light, padding: 18,
  },
  analisisQuoteChar: { fontSize: 40, lineHeight: 32, fontWeight: "900", color: MetaFitColors.border.accent, marginBottom: 6 },
  analisisTexto: { fontSize: 14, lineHeight: 22 },
  resumenBloque: {
    backgroundColor: MetaFitColors.background.card,
    borderRadius: 16, borderWidth: 1, borderColor: MetaFitColors.border.light, padding: 16, gap: 10,
  },
  resumenBloqueHeader: { borderLeftWidth: 3, paddingLeft: 10, marginBottom: 2 },
  resumenBloqueTitle: { fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.6 },
  resumenItem: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  bullet: { width: 5, height: 5, borderRadius: 3, marginTop: 8, flexShrink: 0 },
  resumenItemText: { flex: 1, fontSize: 14, lineHeight: 21 },
  cerrarBtn: {
    alignSelf: "center", paddingVertical: 10, paddingHorizontal: 28,
    borderRadius: 20, borderWidth: 1, borderColor: MetaFitColors.border.light,
    backgroundColor: MetaFitColors.background.card, marginTop: 4,
  },
  cerrarBtnText: { fontSize: 14, fontWeight: "600" },

  // ── Smart Sticky Footer ──
  stickyBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: MetaFitColors.background.card,
    borderTopWidth: 1, borderTopColor: MetaFitColors.border.light,
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 30,
    gap: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.06, shadowRadius: 16, elevation: 10,
  },
  stickyBarInfo: { flex: 1, gap: 5 },
  stickyBarRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 },
  stickyBarKcal: { fontSize: 19, fontWeight: "800", letterSpacing: -0.5 },
  stickyRangePill: {
    backgroundColor: MetaFitColors.background.elevated,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: MetaFitColors.border.accent,
  },
  stickyRangePillText: { fontSize: 11, fontWeight: "700" },
  stickyBarMacros: { fontSize: 11, fontWeight: "600" },
  stickyBarCount: { fontSize: 11 },
  analizarBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: MetaFitColors.button.primary,
    paddingVertical: 14, paddingHorizontal: 22, borderRadius: 14,
    shadowColor: MetaFitColors.button.primary,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  analizarBtnDisabled: { opacity: 0.4, shadowOpacity: 0 },
  analizarBtnText: { fontSize: 15, fontWeight: "700" },
});
