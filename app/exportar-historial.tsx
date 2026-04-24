import { IconSymbol } from "@/components/ui/icon-symbol";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { MetaFitColors } from "@/constants/theme";
import { obtenerConsumosPorRango, type Consumo } from "@/utils/consumos";
import * as Print from "expo-print";
import { router } from "expo-router";
import * as Sharing from "expo-sharing";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar, LocaleConfig } from "react-native-calendars";

// Spanish locale
LocaleConfig.locales["es"] = {
  monthNames: ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"],
  monthNamesShort: ["Ene.","Feb.","Mar.","Abr.","May.","Jun.","Jul.","Ago.","Sep.","Oct.","Nov.","Dic."],
  dayNames: ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"],
  dayNamesShort: ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"],
  today: "Hoy",
};
LocaleConfig.defaultLocale = "es";

type Modo = "dia" | "rango";
type ConsumoConSeleccion = Consumo & { seleccionado: boolean };

// Parse 'YYYY-MM-DD' to local Date (avoids UTC offset issues)
function dateFromStr(str: string): Date {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function strFromDate(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDisplay(str: string): string {
  const date = dateFromStr(str);
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
}

function formatShort(str: string): string {
  const [y, m, d] = str.split("-");
  return `${d}/${m}/${y}`;
}

function redondear(val: string | undefined): string {
  const n = parseFloat(val || "0");
  return isNaN(n) ? "—" : Math.round(n).toString();
}

function calificacionHexColor(cal: Consumo["calificacion"]): string {
  switch (cal) {
    case "Alta": return "#4A9E6B";
    case "Media": return "#C9943A";
    case "Baja": return "#C94848";
    default: return "#A8B8C4";
  }
}

function getCalificacionColor(cal: Consumo["calificacion"]): string {
  switch (cal) {
    case "Alta": return MetaFitColors.calificacion.alta;
    case "Media": return MetaFitColors.calificacion.media;
    case "Baja": return MetaFitColors.calificacion.baja;
    default: return MetaFitColors.text.tertiary;
  }
}

function generarHtml(
  consumos: ConsumoConSeleccion[],
  fechaInicioStr: string,
  fechaFinStr: string
): string {
  const seleccionados = consumos.filter((c) => c.seleccionado);
  const totalEnergia = seleccionados.reduce((s, c) => s + (parseFloat(c.energia || "0") || 0), 0);
  const totalCarb = seleccionados.reduce((s, c) => s + (parseFloat(c.carb || "0") || 0), 0);
  const totalProteina = seleccionados.reduce((s, c) => s + (parseFloat(c.proteina || "0") || 0), 0);
  const totalGrasa = seleccionados.reduce((s, c) => s + (parseFloat(c.grasa || "0") || 0), 0);
  const totalFibra = seleccionados.reduce((s, c) => s + (parseFloat(c.fibra || "0") || 0), 0);

  const porFecha = new Map<string, ConsumoConSeleccion[]>();
  for (const c of seleccionados) {
    const key = formatShort(strFromDate(new Date(c.fechaCreacion)));
    if (!porFecha.has(key)) porFecha.set(key, []);
    porFecha.get(key)!.push(c);
  }

  const filas = Array.from(porFecha.entries())
    .map(([fecha, items]) =>
      items.map((c) => `
        <tr>
          <td style="padding:8px 12px;color:#6B7C8D;font-size:12px;">${fecha}</td>
          <td style="padding:8px 12px;font-size:13px;">${c.tipoComida || "—"}</td>
          <td style="padding:8px 12px;font-size:13px;font-weight:600;">${c.nombre || "—"}</td>
          <td style="padding:8px 12px;text-align:center;font-size:13px;">${c.cantidad ? c.cantidad + "g" : "—"}</td>
          <td style="padding:8px 12px;text-align:center;font-size:13px;font-weight:600;color:#5B96B0;">${redondear(c.energia)}</td>
          <td style="padding:8px 12px;text-align:center;font-size:13px;">${redondear(c.carb)}</td>
          <td style="padding:8px 12px;text-align:center;font-size:13px;">${redondear(c.proteina)}</td>
          <td style="padding:8px 12px;text-align:center;font-size:13px;">${redondear(c.grasa)}</td>
          <td style="padding:8px 12px;text-align:center;">
            <span style="background:${calificacionHexColor(c.calificacion)}22;color:${calificacionHexColor(c.calificacion)};padding:2px 8px;border-radius:12px;font-size:11px;font-weight:700;">${c.calificacion || "—"}</span>
          </td>
        </tr>`).join("")
    ).join("");

  const esMismoDia = fechaInicioStr === fechaFinStr;
  const rangoLabel = esMismoDia
    ? formatDisplay(fechaInicioStr)
    : `${formatDisplay(fechaInicioStr)} — ${formatDisplay(fechaFinStr)}`;

  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"/>
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:-apple-system,Helvetica,Arial,sans-serif;background:#F2EDE4;color:#2C3E50;padding:32px;}
  .header{display:flex;align-items:center;gap:16px;margin-bottom:8px;}
  .logo{width:48px;height:48px;border-radius:50%;background:#5B96B0;display:flex;align-items:center;justify-content:center;color:white;font-size:22px;font-weight:800;text-align:center;line-height:48px;}
  .app-name{font-size:28px;font-weight:800;letter-spacing:-0.5px;}
  .subtitle{font-size:13px;color:#6B7C8D;margin-top:2px;}
  .range-badge{display:inline-block;margin-top:16px;margin-bottom:28px;background:#EEF5F9;border:1px solid #B8CDD6;border-radius:10px;padding:8px 16px;font-size:13px;color:#5B96B0;font-weight:600;}
  .section-label{font-size:11px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;color:#A8B8C4;margin-bottom:10px;}
  .summary-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:28px;}
  .summary-card{background:white;border-radius:12px;padding:14px;text-align:center;box-shadow:0 1px 3px rgba(44,62,80,.07);}
  .summary-value{font-size:22px;font-weight:800;color:#5B96B0;letter-spacing:-0.5px;}
  .summary-label{font-size:11px;color:#6B7C8D;margin-top:2px;}
  table{width:100%;border-collapse:collapse;background:white;border-radius:14px;overflow:hidden;box-shadow:0 1px 4px rgba(44,62,80,.08);margin-bottom:28px;}
  thead{background:#EEF5F9;}
  th{padding:10px 12px;text-align:left;font-size:11px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:#6B7C8D;}
  th.c{text-align:center;}
  tbody tr{border-top:1px solid #DDD6CC;}
  .total td{background:#EEF5F9;font-weight:700;border-top:2px solid #B8CDD6;}
  .footer{margin-top:20px;font-size:11px;color:#A8B8C4;text-align:center;}
</style></head>
<body>
  <div class="header">
    <div class="logo">M</div>
    <div><div class="app-name">MetaFit</div><div class="subtitle">Historial nutricional</div></div>
  </div>
  <div class="range-badge">${rangoLabel}</div>
  <div class="section-label">Resumen — ${seleccionados.length} registros</div>
  <div class="summary-grid">
    <div class="summary-card"><div class="summary-value">${Math.round(totalEnergia)}</div><div class="summary-label">kcal</div></div>
    <div class="summary-card"><div class="summary-value">${Math.round(totalCarb)}g</div><div class="summary-label">Carbos</div></div>
    <div class="summary-card"><div class="summary-value">${Math.round(totalProteina)}g</div><div class="summary-label">Proteína</div></div>
    <div class="summary-card"><div class="summary-value">${Math.round(totalGrasa)}g</div><div class="summary-label">Grasa</div></div>
    <div class="summary-card"><div class="summary-value">${Math.round(totalFibra)}g</div><div class="summary-label">Fibra</div></div>
  </div>
  <div class="section-label">Detalle de registros</div>
  <table>
    <thead><tr>
      <th>Fecha</th><th>Tipo</th><th>Nombre</th><th class="c">Cant.</th>
      <th class="c">kcal</th><th class="c">Carb(g)</th><th class="c">Prot(g)</th><th class="c">Grasa(g)</th><th class="c">Calif.</th>
    </tr></thead>
    <tbody>
      ${filas}
      <tr class="total">
        <td colspan="4" style="padding:8px 12px;font-size:13px;">Total</td>
        <td style="padding:8px 12px;text-align:center;color:#5B96B0;">${Math.round(totalEnergia)}</td>
        <td style="padding:8px 12px;text-align:center;">${Math.round(totalCarb)}</td>
        <td style="padding:8px 12px;text-align:center;">${Math.round(totalProteina)}</td>
        <td style="padding:8px 12px;text-align:center;">${Math.round(totalGrasa)}</td>
        <td></td>
      </tr>
    </tbody>
  </table>
  <div class="footer">Generado con MetaFit · ${new Date().toLocaleDateString("es-ES",{day:"numeric",month:"long",year:"numeric"})}</div>
</body></html>`;
}

export default function ExportarHistorialScreen() {
  const todayStr = strFromDate(new Date());

  const [modo, setModo] = useState<Modo>("dia");
  // For 'dia' mode: only fechaInicio is used (fechaFin = fechaInicio)
  // For 'rango' mode: select start then end
  const [fechaInicio, setFechaInicio] = useState<string | null>(null);
  const [fechaFin, setFechaFin] = useState<string | null>(null);
  const [esperandoFin, setEsperandoFin] = useState(false); // rango: waiting for second tap

  const [consumos, setConsumos] = useState<ConsumoConSeleccion[]>([]);
  const [isBuscando, setIsBuscando] = useState(false);
  const [isExportando, setIsExportando] = useState(false);
  const [buscado, setBuscado] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(true);

  // Build markedDates for the Calendar
  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};
    if (!fechaInicio) return marks;

    const fin = fechaFin ?? fechaInicio;

    if (fechaInicio === fin) {
      marks[fechaInicio] = {
        selected: true,
        startingDay: true,
        endingDay: true,
        color: MetaFitColors.button.primary,
        textColor: "#fff",
      };
      return marks;
    }

    // Fill all days in range
    const start = dateFromStr(fechaInicio);
    const end = dateFromStr(fin);
    let cur = new Date(start);
    while (cur <= end) {
      const key = strFromDate(cur);
      const isStart = key === fechaInicio;
      const isEnd = key === fin;
      marks[key] = {
        startingDay: isStart,
        endingDay: isEnd,
        color: isStart || isEnd ? MetaFitColors.button.primary : MetaFitColors.background.elevated,
        textColor: isStart || isEnd ? "#fff" : MetaFitColors.text.primary,
      };
      cur.setDate(cur.getDate() + 1);
    }
    return marks;
  }, [fechaInicio, fechaFin]);

  const handleDayPress = (day: { dateString: string }) => {
    const d = day.dateString;
    if (modo === "dia") {
      setFechaInicio(d);
      setFechaFin(d);
      setBuscado(false);
      setConsumos([]);
      setCalendarVisible(true);
    } else {
      // Range mode
      if (!fechaInicio || !esperandoFin) {
        // First tap: set start, clear end
        setFechaInicio(d);
        setFechaFin(null);
        setEsperandoFin(true);
        setBuscado(false);
        setConsumos([]);
      } else {
        // Second tap: set end (ensure order)
        if (d < fechaInicio) {
          setFechaInicio(d);
          setFechaFin(fechaInicio);
        } else {
          setFechaFin(d);
        }
        setEsperandoFin(false);
        setBuscado(false);
        setConsumos([]);
      }
    }
  };

  const handleModoChange = (newModo: Modo) => {
    setModo(newModo);
    setFechaInicio(null);
    setFechaFin(null);
    setEsperandoFin(false);
    setBuscado(false);
    setConsumos([]);
    setCalendarVisible(true);
  };

  const canBuscar = fechaInicio && (modo === "dia" || fechaFin);

  const handleBuscar = async () => {
    if (!fechaInicio) return;
    const inicio = dateFromStr(fechaInicio);
    const fin = fechaFin ? dateFromStr(fechaFin) : dateFromStr(fechaInicio);

    setIsBuscando(true);
    try {
      const resultado = await obtenerConsumosPorRango(inicio, fin);
      setConsumos(resultado.map((c) => ({ ...c, seleccionado: true })));
      setBuscado(true);
      setCalendarVisible(false);
    } catch {
      Alert.alert("Error", "No se pudieron cargar los registros");
    } finally {
      setIsBuscando(false);
    }
  };

  const toggleConsumo = (id: string) => {
    setConsumos((prev) => prev.map((c) => (c.id === id ? { ...c, seleccionado: !c.seleccionado } : c)));
  };

  const toggleTodos = () => {
    const allOn = consumos.every((c) => c.seleccionado);
    setConsumos((prev) => prev.map((c) => ({ ...c, seleccionado: !allOn })));
  };

  const handleExportar = async () => {
    const seleccionados = consumos.filter((c) => c.seleccionado);
    if (seleccionados.length === 0) {
      Alert.alert("Sin selección", "Selecciona al menos un registro para exportar");
      return;
    }
    setIsExportando(true);
    try {
      const html = generarHtml(consumos, fechaInicio!, fechaFin ?? fechaInicio!);
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        Alert.alert("No disponible", "La función de compartir no está disponible en este dispositivo");
        return;
      }
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: "Exportar historial MetaFit",
        UTI: "com.adobe.pdf",
      });
    } catch (error: any) {
      Alert.alert("Error", `No se pudo generar el PDF: ${error.message || "Error desconocido"}`);
    } finally {
      setIsExportando(false);
    }
  };

  const seleccionadosCount = consumos.filter((c) => c.seleccionado).length;
  const todosSeleccionados = consumos.length > 0 && consumos.every((c) => c.seleccionado);

  // Label shown under calendar
  const selectionLabel = () => {
    if (!fechaInicio) return null;
    if (modo === "dia") return `Día seleccionado: ${formatDisplay(fechaInicio)}`;
    if (!fechaFin) return `Inicio: ${formatDisplay(fechaInicio)} — selecciona el día de fin`;
    return `${formatDisplay(fechaInicio)} — ${formatDisplay(fechaFin)}`;
  };

  return (
    <ThemedView style={styles.container} lightColor={MetaFitColors.background.white}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={20} color={MetaFitColors.text.secondary} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle} lightColor={MetaFitColors.text.primary}>
          Exportar historial
        </ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Mode toggle */}
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeButton, modo === "dia" && styles.modeButtonActive]}
            onPress={() => handleModoChange("dia")}
            activeOpacity={0.7}
          >
            <IconSymbol
              name="calendar"
              size={14}
              color={modo === "dia" ? MetaFitColors.button.primary : MetaFitColors.text.tertiary}
            />
            <ThemedText
              style={[styles.modeButtonText, modo === "dia" && styles.modeButtonTextActive]}
              lightColor={modo === "dia" ? MetaFitColors.button.primary : MetaFitColors.text.secondary}
            >
              Un día
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, modo === "rango" && styles.modeButtonActive]}
            onPress={() => handleModoChange("rango")}
            activeOpacity={0.7}
          >
            <IconSymbol
              name="calendar.badge.plus"
              size={14}
              color={modo === "rango" ? MetaFitColors.button.primary : MetaFitColors.text.tertiary}
            />
            <ThemedText
              style={[styles.modeButtonText, modo === "rango" && styles.modeButtonTextActive]}
              lightColor={modo === "rango" ? MetaFitColors.button.primary : MetaFitColors.text.secondary}
            >
              Rango de fechas
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Calendar (expandido) o fila compacta (colapsado) */}
        {calendarVisible ? (
          <>
            <View style={styles.calendarWrapper}>
              <Calendar
                onDayPress={handleDayPress}
                markedDates={markedDates}
                markingType="period"
                maxDate={todayStr}
                enableSwipeMonths
                theme={{
                  backgroundColor: "transparent",
                  calendarBackground: "transparent",
                  textSectionTitleColor: MetaFitColors.text.tertiary,
                  selectedDayBackgroundColor: MetaFitColors.button.primary,
                  selectedDayTextColor: "#fff",
                  todayTextColor: MetaFitColors.button.primary,
                  todayBackgroundColor: MetaFitColors.background.elevated,
                  dayTextColor: MetaFitColors.text.primary,
                  textDisabledColor: MetaFitColors.text.tertiary,
                  arrowColor: MetaFitColors.button.primary,
                  monthTextColor: MetaFitColors.text.primary,
                  textMonthFontWeight: "700",
                  textMonthFontSize: 16,
                  textDayFontSize: 14,
                  textDayHeaderFontSize: 11,
                }}
              />
            </View>

            {selectionLabel() && (
              <View style={styles.selectionLabelContainer}>
                <IconSymbol name="calendar" size={13} color={MetaFitColors.button.primary} />
                <ThemedText style={styles.selectionLabelText} lightColor={MetaFitColors.button.primary}>
                  {selectionLabel()}
                </ThemedText>
              </View>
            )}
          </>
        ) : (
          /* Fila compacta — muestra la selección y permite volver a abrir el calendario */
          <TouchableOpacity
            style={styles.calendarCollapsed}
            onPress={() => setCalendarVisible(true)}
            activeOpacity={0.75}
          >
            <IconSymbol name="calendar" size={16} color={MetaFitColors.button.primary} />
            <ThemedText style={styles.calendarCollapsedText} lightColor={MetaFitColors.text.primary} numberOfLines={1}>
              {selectionLabel()}
            </ThemedText>
            <ThemedText style={styles.calendarCollapsedEdit} lightColor={MetaFitColors.button.primary}>
              Cambiar
            </ThemedText>
            <IconSymbol name="chevron.down" size={13} color={MetaFitColors.button.primary} />
          </TouchableOpacity>
        )}

        {/* Search button */}
        <TouchableOpacity
          style={[styles.buscarButton, (!canBuscar || isBuscando) && styles.buttonDisabled]}
          onPress={handleBuscar}
          disabled={!canBuscar || isBuscando}
        >
          {isBuscando ? (
            <ActivityIndicator size="small" color={MetaFitColors.text.white} />
          ) : (
            <>
              <IconSymbol name="magnifyingglass" size={16} color={MetaFitColors.text.white} />
              <ThemedText style={styles.buscarButtonText} lightColor={MetaFitColors.text.white}>
                Buscar registros
              </ThemedText>
            </>
          )}
        </TouchableOpacity>

        {/* Results */}
        {buscado && (
          <>
            {consumos.length === 0 ? (
              <View style={styles.emptyState}>
                <ThemedText style={styles.emptyIcon}>📋</ThemedText>
                <ThemedText style={styles.emptyTitle} lightColor={MetaFitColors.text.primary}>
                  Sin registros
                </ThemedText>
                <ThemedText style={styles.emptySubtitle} lightColor={MetaFitColors.text.secondary}>
                  No hay consumos en el período seleccionado
                </ThemedText>
              </View>
            ) : (
              <>
                {/* Select all row */}
                <View style={styles.selectionHeader}>
                  <TouchableOpacity
                    style={styles.toggleTodosButton}
                    onPress={toggleTodos}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.checkbox, todosSeleccionados && styles.checkboxChecked]}>
                      {todosSeleccionados && (
                        <IconSymbol name="checkmark" size={11} color="#fff" />
                      )}
                    </View>
                    <ThemedText style={styles.toggleTodosText} lightColor={MetaFitColors.text.primary}>
                      {todosSeleccionados ? "Deseleccionar todo" : "Seleccionar todo"}
                    </ThemedText>
                  </TouchableOpacity>
                  <View style={styles.countBadge}>
                    <ThemedText style={styles.countBadgeText} lightColor={MetaFitColors.button.primary}>
                      {seleccionadosCount}/{consumos.length}
                    </ThemedText>
                  </View>
                </View>

                {/* Record list */}
                <View style={styles.recordsList}>
                  {consumos.map((consumo) => (
                    <TouchableOpacity
                      key={consumo.id}
                      style={[styles.recordCard, consumo.seleccionado && styles.recordCardSelected]}
                      onPress={() => toggleConsumo(consumo.id)}
                      activeOpacity={0.75}
                    >
                      <View style={[styles.checkbox, consumo.seleccionado && styles.checkboxChecked]}>
                        {consumo.seleccionado && (
                          <IconSymbol name="checkmark" size={11} color="#fff" />
                        )}
                      </View>
                      <View style={styles.recordInfo}>
                        <View style={styles.recordTopRow}>
                          <ThemedText
                            style={styles.recordNombre}
                            lightColor={MetaFitColors.text.primary}
                            numberOfLines={1}
                          >
                            {consumo.nombre || consumo.tipoComida || "Sin nombre"}
                          </ThemedText>
                          {consumo.calificacion && (
                            <View style={[styles.calBadge, { backgroundColor: getCalificacionColor(consumo.calificacion) + "22" }]}>
                              <ThemedText style={styles.calBadgeText} lightColor={getCalificacionColor(consumo.calificacion)}>
                                {consumo.calificacion}
                              </ThemedText>
                            </View>
                          )}
                        </View>
                        <View style={styles.recordBottomRow}>
                          <ThemedText style={styles.recordMeta} lightColor={MetaFitColors.text.secondary}>
                            {formatShort(strFromDate(new Date(consumo.fechaCreacion)))} · {consumo.tipoComida}
                          </ThemedText>
                          {consumo.energia && (
                            <ThemedText style={styles.recordKcal} lightColor={MetaFitColors.button.primary}>
                              {Math.round(parseFloat(consumo.energia))} kcal
                            </ThemedText>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* Export button fixed at bottom */}
      {seleccionadosCount > 0 && (
        <View style={styles.exportFooter}>
          <TouchableOpacity
            style={[styles.exportButton, isExportando && styles.buttonDisabled]}
            onPress={handleExportar}
            disabled={isExportando}
            activeOpacity={0.85}
          >
            {isExportando ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <IconSymbol name="arrow.down.doc" size={18} color="#fff" />
                <ThemedText style={styles.exportButtonText} lightColor="#fff">
                  Exportar PDF ({seleccionadosCount} {seleccionadosCount === 1 ? "registro" : "registros"})
                </ThemedText>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: MetaFitColors.background.white },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: MetaFitColors.background.card,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: "600", flex: 1 },
  headerSpacer: { width: 48 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 140 },
  modeToggle: {
    flexDirection: "row",
    backgroundColor: MetaFitColors.background.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
    padding: 4,
    marginBottom: 16,
    gap: 4,
  },
  modeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modeButtonActive: {
    backgroundColor: MetaFitColors.background.elevated,
    borderWidth: 1,
    borderColor: MetaFitColors.border.accent,
  },
  modeButtonText: { fontSize: 13, fontWeight: "600" },
  modeButtonTextActive: { color: MetaFitColors.button.primary },
  calendarWrapper: {
    backgroundColor: MetaFitColors.background.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
    padding: 8,
    marginBottom: 12,
    overflow: "hidden",
  },
  selectionLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: MetaFitColors.background.elevated,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: MetaFitColors.border.accent,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  selectionLabelText: { fontSize: 13, fontWeight: "600", flex: 1 },
  calendarCollapsed: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: MetaFitColors.background.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: MetaFitColors.border.accent,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 16,
  },
  calendarCollapsedText: { fontSize: 14, fontWeight: "600", flex: 1 },
  calendarCollapsedEdit: { fontSize: 13, fontWeight: "700" },
  buscarButton: {
    backgroundColor: MetaFitColors.button.primary,
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 24,
    shadowColor: "#2C3E50",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buscarButtonText: { fontSize: 15, fontWeight: "700", letterSpacing: 0.2 },
  buttonDisabled: { opacity: 0.45 },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    backgroundColor: MetaFitColors.background.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
    gap: 8,
  },
  emptyIcon: { fontSize: 40, lineHeight: 50 },
  emptyTitle: { fontSize: 16, fontWeight: "700" },
  emptySubtitle: { fontSize: 13, textAlign: "center", paddingHorizontal: 20 },
  selectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  toggleTodosButton: { flexDirection: "row", alignItems: "center", gap: 10 },
  toggleTodosText: { fontSize: 14, fontWeight: "600" },
  countBadge: {
    backgroundColor: MetaFitColors.background.elevated,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: MetaFitColors.border.accent,
  },
  countBadgeText: { fontSize: 12, fontWeight: "700" },
  recordsList: { gap: 8 },
  recordCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: MetaFitColors.background.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
  },
  recordCardSelected: {
    borderColor: MetaFitColors.border.accent,
    backgroundColor: MetaFitColors.background.elevated,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: MetaFitColors.border.light,
    backgroundColor: MetaFitColors.background.white,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: MetaFitColors.button.primary,
    borderColor: MetaFitColors.button.primary,
  },
  recordInfo: { flex: 1, gap: 5 },
  recordTopRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  recordNombre: { fontSize: 14, fontWeight: "600", flex: 1 },
  calBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  calBadgeText: { fontSize: 11, fontWeight: "700" },
  recordBottomRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  recordMeta: { fontSize: 12 },
  recordKcal: { fontSize: 12, fontWeight: "700" },
  exportFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 36,
    backgroundColor: MetaFitColors.background.white,
    borderTopWidth: 1,
    borderTopColor: MetaFitColors.border.light,
  },
  exportButton: {
    backgroundColor: MetaFitColors.button.primary,
    borderRadius: 16,
    paddingVertical: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: "#2C3E50",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  exportButtonText: { fontSize: 16, fontWeight: "700", letterSpacing: 0.2 },
});
