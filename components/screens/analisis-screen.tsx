import { IconSymbol } from "@/components/ui/icon-symbol";
import { ThemedText } from "@/components/ui/themed-text";
import { MetaFitColors } from "@/constants/theme";
import { obtenerConsumosPorRango, type Consumo } from "@/utils/consumos";
import { getNutritionalProfile } from "@/utils/nutritional-profile";
import { analizarPatronAlimenticio, type AnalizarPatronResponse } from "@/utils/openai";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Image } from "expo-image";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ModoPeriodo = "dia" | "7dias" | "30dias";
type PickerActivo = "inicio" | "fin" | "dia" | null;

const MODOS: { key: ModoPeriodo; label: string }[] = [
  { key: "dia",   label: "1 día" },
  { key: "7dias", label: "7 días" },
  { key: "30dias",label: "30 días" },
];

const TIPO_CONFIG: Record<string, { emoji: string; color: string; bg: string }> = {
  Desayuno: { emoji: "☀️", color: "#C9943A", bg: "#FFF8EC" },
  Almuerzo: { emoji: "🌿", color: "#4A9E6B", bg: "#F0FAF4" },
  Merienda: { emoji: "🫐", color: "#7B6FD4", bg: "#F3F1FD" },
  Cena:     { emoji: "🌙", color: "#5B96B0", bg: "#EEF5F9" },
  Snack:    { emoji: "🍎", color: "#C94848", bg: "#FFF0F0" },
  Comida:   { emoji: "🍽️", color: "#6B7C8D", bg: "#F5F5F5" },
};

function getCalificacionBadge(cal: "Muy saludable" | "Equilibrada" | "Poco nutritiva") {
  if (cal === "Muy saludable") return { bg: "#F0FAF4", color: "#4A9E6B", label: "Muy saludable", score: 90 };
  if (cal === "Poco nutritiva") return { bg: "#FFF0F0", color: "#C94848", label: "Poco nutritiva", score: 30 };
  return { bg: "#FFF8EC", color: "#C9943A", label: "Equilibrada", score: 65 };
}

function formatDate(date: Date): string {
  const d = date.getDate().toString().padStart(2, "0");
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

function formatDateShort(date: Date): string {
  const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return `${date.getDate()} ${meses[date.getMonth()]}`;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function MacroPropBar({ carb, proteina, grasa }: { carb: number; proteina: number; grasa: number }) {
  const cCal = carb * 4;
  const pCal = proteina * 4;
  const gCal = grasa * 9;
  const total = cCal + pCal + gCal;
  if (total === 0) return null;
  return (
    <View style={{ flexDirection: "row", height: 4, borderRadius: 2, overflow: "hidden", gap: 1.5 }}>
      <View style={{ flex: pCal / total, backgroundColor: "#E8636A" }} />
      <View style={{ flex: cCal / total, backgroundColor: "#E8A542" }} />
      <View style={{ flex: gCal / total, backgroundColor: MetaFitColors.button.primary }} />
    </View>
  );
}

export function AnalisisScreen() {
  const scrollViewRef = useRef<ScrollView>(null);
  // Initial mode is "dia" → index 0
  const indicatorAnim = useRef(new Animated.Value(0)).current;

  const [modoPeriodo, setModoPeriodo] = useState<ModoPeriodo>("dia");
  const [fechaInicio, setFechaInicio] = useState<Date>(() => startOfDay(new Date()));
  const [fechaFin, setFechaFin] = useState<Date>(() => endOfDay(new Date()));
  const [diaSeleccionado, setDiaSeleccionado] = useState<Date>(new Date());
  const [pickerActivo, setPickerActivo] = useState<PickerActivo>(null);
  const [tempDate, setTempDate] = useState<Date>(new Date());

  const [consumos, setConsumos] = useState<Consumo[]>([]);
  const [isLoadingConsumos, setIsLoadingConsumos] = useState(false);
  const [buscado, setBuscado] = useState(false);

  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [isAnalizando, setIsAnalizando] = useState(false);
  const [resultado, setResultado] = useState<AnalizarPatronResponse | null>(null);
  const [errorAnalisis, setErrorAnalisis] = useState<string | null>(null);

  const animateToIndex = useCallback((idx: number) => {
    Animated.spring(indicatorAnim, {
      toValue: idx,
      useNativeDriver: false,
      tension: 130,
      friction: 16,
    }).start();
  }, [indicatorAnim]);

  const aplicarModo = useCallback((modo: ModoPeriodo, idx: number) => {
    setModoPeriodo(modo);
    setResultado(null);
    setErrorAnalisis(null);
    animateToIndex(idx);

    if (modo === "dia") {
      // Open day picker — don't change dates yet
      setTempDate(diaSeleccionado);
      setPickerActivo("dia");
    } else if (modo === "7dias") {
      setFechaInicio(daysAgo(6));
      setFechaFin(new Date());
    } else if (modo === "30dias") {
      setFechaInicio(daysAgo(29));
      setFechaFin(new Date());
    }
  }, [animateToIndex, diaSeleccionado]);

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
      const rangoStr = `${formatDate(fechaInicio)} – ${formatDate(fechaFin)}`;
      const data = await analizarPatronAlimenticio(consumosSeleccionados, rangoStr, perfil ?? undefined);
      setResultado(data);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 200);
    } catch (err: any) {
      setErrorAnalisis(err.message || "Error al analizar el patrón alimenticio");
    } finally {
      setIsAnalizando(false);
    }
  };

  const handleOpenPicker = (cual: "inicio" | "fin") => {
    setTempDate(cual === "inicio" ? fechaInicio : fechaFin);
    setPickerActivo(cual);
  };

  const handlePickerChange = (_: any, date?: Date) => {
    if (Platform.OS === "android") {
      setPickerActivo(null);
      if (date) {
        if (pickerActivo === "dia") {
          setDiaSeleccionado(date);
          setFechaInicio(date);
          setFechaFin(date);
        } else if (pickerActivo === "inicio") setFechaInicio(date);
        else if (pickerActivo === "fin") setFechaFin(date);
      }
    } else {
      if (date) setTempDate(date);
    }
  };

  const handleAcceptDate = () => {
    if (pickerActivo === "dia") {
      setDiaSeleccionado(tempDate);
      setFechaInicio(startOfDay(tempDate));
      setFechaFin(endOfDay(tempDate));
    } else if (pickerActivo === "inicio") {
      setFechaInicio(tempDate);
    } else if (pickerActivo === "fin") {
      setFechaFin(tempDate);
    }
    setPickerActivo(null);
  };

  const handleCancelDate = () => {
    // If user cancels "dia" picker without ever picking, revert segment to previous
    if (pickerActivo === "dia" && modoPeriodo === "dia") {
      // Stay on dia mode but keep previous diaSeleccionado
    }
    setPickerActivo(null);
  };

  // Label shown inside the "Día" segment (shows chosen date when one is set)
  const diaSegmentLabel = modoPeriodo === "dia" ? formatDateShort(diaSeleccionado) : "Día";

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
            Comprende tus hábitos alimenticios
          </ThemedText>
        </View>

        {/* ── Segmented Period Control (3 segments) ── */}
        <View style={styles.segmentTrack}>
          <Animated.View
            style={[
              styles.segmentIndicator,
              {
                left: indicatorAnim.interpolate({
                  inputRange: [0, 1, 2],
                  outputRange: ["2.5%", "35.5%", "68.2%"],
                }),
              },
            ]}
          />
          {MODOS.map((modo, idx) => {
            const isActive = modoPeriodo === modo.key;
            const label = modo.key === "dia" ? diaSegmentLabel : modo.label;
            return (
              <TouchableOpacity
                key={modo.key}
                style={styles.segmentItem}
                onPress={() => aplicarModo(modo.key, idx)}
                activeOpacity={0.7}
              >
                <ThemedText
                  style={[styles.segmentLabel, isActive && styles.segmentLabelActive]}
                  lightColor={isActive ? "#fff" : MetaFitColors.text.secondary}
                  numberOfLines={1}
                >
                  {label}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Date Section ── */}
        <View style={styles.dateSection}>
          {modoPeriodo === "dia" ? (
            /* Single-day picker button */
            <TouchableOpacity
              style={styles.diaButton}
              onPress={() => {
                setTempDate(diaSeleccionado);
                setPickerActivo("dia");
              }}
              activeOpacity={0.8}
            >
              <View style={styles.diaButtonInner}>
                <View>
                  <ThemedText style={styles.dateButtonLabel} lightColor={MetaFitColors.text.tertiary}>
                    Día seleccionado
                  </ThemedText>
                  <ThemedText style={styles.diaButtonValue} lightColor={MetaFitColors.text.primary}>
                    {formatDateShort(diaSeleccionado)}
                  </ThemedText>
                </View>
                <View style={styles.diaButtonIcon}>
                  <IconSymbol name="calendar" size={18} color={MetaFitColors.button.primary} />
                </View>
              </View>
            </TouchableOpacity>
          ) : (
            /* Date range (from → to) */
            <View style={styles.dateRow}>
              <TouchableOpacity style={styles.dateButton} onPress={() => handleOpenPicker("inicio")} activeOpacity={0.8}>
                <ThemedText style={styles.dateButtonLabel} lightColor={MetaFitColors.text.tertiary}>
                  Desde
                </ThemedText>
                <ThemedText style={styles.dateButtonValue} lightColor={MetaFitColors.text.primary}>
                  {formatDateShort(fechaInicio)}
                </ThemedText>
              </TouchableOpacity>

              <View style={styles.dateSepLine}>
                <View style={styles.dateSepDot} />
                <View style={styles.dateSepTrack} />
                <View style={styles.dateSepDot} />
              </View>

              <TouchableOpacity style={styles.dateButton} onPress={() => handleOpenPicker("fin")} activeOpacity={0.8}>
                <ThemedText style={styles.dateButtonLabel} lightColor={MetaFitColors.text.tertiary}>
                  Hasta
                </ThemedText>
                <ThemedText style={styles.dateButtonValue} lightColor={MetaFitColors.text.primary}>
                  {formatDateShort(fechaFin)}
                </ThemedText>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={styles.buscarBtn} onPress={cargarConsumos} activeOpacity={0.8}>
            <IconSymbol name="magnifyingglass" size={15} color="#fff" />
            <ThemedText style={styles.buscarBtnText} lightColor="#fff">
              Buscar registros
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* ── Date Pickers ── */}
        {pickerActivo !== null && Platform.OS === "ios" && (
          <View style={styles.iosPickerContainer}>
            <View style={styles.iosPickerHeader}>
              <TouchableOpacity onPress={handleCancelDate} style={styles.iosPickerBtn}>
                <ThemedText style={styles.iosPickerCancelText} lightColor={MetaFitColors.text.secondary}>
                  Cancelar
                </ThemedText>
              </TouchableOpacity>
              <ThemedText style={styles.iosPickerTitle} lightColor={MetaFitColors.text.primary}>
                {pickerActivo === "dia"
                  ? "Elegir día"
                  : pickerActivo === "inicio"
                  ? "Fecha inicio"
                  : "Fecha fin"}
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
              maximumDate={pickerActivo === "fin" ? new Date() : pickerActivo === "dia" ? new Date() : fechaFin}
              minimumDate={pickerActivo === "fin" ? fechaInicio : undefined}
              style={styles.iosDatePicker}
            />
          </View>
        )}
        {pickerActivo !== null && Platform.OS === "android" && (
          <DateTimePicker
            value={pickerActivo === "inicio" ? fechaInicio : pickerActivo === "dia" ? diaSeleccionado : fechaFin}
            mode="date"
            display="default"
            onChange={handlePickerChange}
            maximumDate={pickerActivo === "fin" ? new Date() : pickerActivo === "dia" ? new Date() : fechaFin}
            minimumDate={pickerActivo === "fin" ? fechaInicio : undefined}
          />
        )}

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
                const fecha = consumo.fechaCreacion ? formatDateShort(new Date(consumo.fechaCreacion)) : "";

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
            <ThemedText style={styles.errorText} lightColor={MetaFitColors.error}>
              {errorAnalisis}
            </ThemedText>
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

      {/* ── Sticky Footer ── */}
      {consumos.length > 0 && (
        <View style={styles.stickyBar}>
          <View style={styles.stickyBarInfo}>
            <MacroPropBar carb={totales.carb} proteina={totales.proteina} grasa={totales.grasa} />
            <View style={styles.stickyBarRow}>
              <ThemedText style={styles.stickyBarKcal} lightColor={MetaFitColors.button.primary}>
                {Math.round(totales.energia)} kcal
              </ThemedText>
              <ThemedText style={styles.stickyBarMacros} lightColor={MetaFitColors.text.secondary}>
                C {Math.round(totales.carb)}g · P {Math.round(totales.proteina)}g · G {Math.round(totales.grasa)}g
              </ThemedText>
            </View>
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
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 150 },

  // ── Header ──
  pageHeader: { marginBottom: 22 },
  pageTitle: { fontSize: 34, fontWeight: "800", letterSpacing: -0.8, lineHeight: 42, marginBottom: 2 },
  pageSubtitle: { fontSize: 14 },

  // ── Segmented Control (4 segments) ──
  segmentTrack: {
    flexDirection: "row",
    backgroundColor: MetaFitColors.background.card,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
    height: 46,
    position: "relative",
    marginBottom: 18,
  },
  segmentIndicator: {
    position: "absolute",
    top: 4,
    bottom: 4,
    width: "30%",
    backgroundColor: MetaFitColors.button.primary,
    borderRadius: 10,
    shadowColor: MetaFitColors.button.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 6,
    elevation: 3,
  },
  segmentItem: { flex: 1, alignItems: "center", justifyContent: "center", zIndex: 1 },
  segmentLabel: { fontSize: 14, fontWeight: "600", letterSpacing: 0.1 },
  segmentLabelActive: { fontWeight: "700" },

  // ── Date Section ──
  dateSection: { gap: 12, marginBottom: 24 },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  dateButton: {
    flex: 1,
    backgroundColor: MetaFitColors.background.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
    paddingVertical: 11,
    paddingHorizontal: 14,
    gap: 2,
  },
  dateButtonLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 0.7, textTransform: "uppercase" },
  dateButtonValue: { fontSize: 18, fontWeight: "700", letterSpacing: -0.3 },

  // Single-day button
  diaButton: {
    backgroundColor: MetaFitColors.background.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: MetaFitColors.border.accent,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  diaButtonInner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  diaButtonValue: { fontSize: 22, fontWeight: "800", letterSpacing: -0.5, marginTop: 2 },
  diaButtonIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: MetaFitColors.background.elevated,
    alignItems: "center",
    justifyContent: "center",
  },

  dateSepLine: { flexDirection: "row", alignItems: "center", gap: 4, paddingTop: 12 },
  dateSepDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: MetaFitColors.border.accent },
  dateSepTrack: { width: 12, height: 1.5, backgroundColor: MetaFitColors.border.accent },

  buscarBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: MetaFitColors.button.primary,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: MetaFitColors.button.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 3,
  },
  buscarBtnText: { fontSize: 15, fontWeight: "700", letterSpacing: 0.1 },

  // ── iOS Picker ──
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
  iosPickerTitle: { fontSize: 15, fontWeight: "600" },
  iosPickerBtn: { paddingVertical: 4, paddingHorizontal: 4 },
  iosPickerCancelText: { fontSize: 15, fontWeight: "500" },
  iosPickerAcceptText: { fontSize: 15, fontWeight: "700" },
  iosDatePicker: { height: 200 },

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
  listaSection: { gap: 12 },
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
    borderWidth: 1, borderColor: "#F5C6C6",
    padding: 16, marginTop: 16,
  },
  errorText: { fontSize: 14, lineHeight: 20 },

  // ── Resultado ──
  resultadoSection: { marginTop: 24, gap: 12 },
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
    borderRadius: 16, borderWidth: 1,
    borderColor: MetaFitColors.border.light, padding: 18,
  },
  analisisQuoteChar: { fontSize: 40, lineHeight: 32, fontWeight: "900", color: MetaFitColors.border.accent, marginBottom: 6 },
  analisisTexto: { fontSize: 14, lineHeight: 22 },
  resumenBloque: {
    backgroundColor: MetaFitColors.background.card,
    borderRadius: 16, borderWidth: 1,
    borderColor: MetaFitColors.border.light,
    padding: 16, gap: 10,
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

  // ── Sticky Footer ──
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
  stickyBarRow: { flexDirection: "row", alignItems: "baseline", gap: 8, marginTop: 2 },
  stickyBarKcal: { fontSize: 20, fontWeight: "800", letterSpacing: -0.5 },
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
