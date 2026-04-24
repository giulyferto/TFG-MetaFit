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
import DateTimePicker from "@react-native-community/datetimepicker";
import { router, useFocusEffect } from "expo-router";

import { useCallback, useState } from "react";
import { Alert, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function FeedbackListScreen() {
  const [consumos, setConsumos] = useState<Consumo[]>([]);
  const [resumen, setResumen] = useState<ResumenNutricional | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [tempDate, setTempDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

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

  const handleOpenDatePicker = () => {
    setTempDate(selectedDate);
    setShowDatePicker(true);
  };

  useFocusEffect(
    useCallback(() => {
      cargarConsumos();
    }, [cargarConsumos])
  );

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
      if (event.type === "set" && date) {
        setSelectedDate(date);
      }
    } else {
      if (date) {
        setTempDate(date);
      }
    }
  };

  const handleAcceptDate = () => {
    setSelectedDate(tempDate);
    setShowDatePicker(false);
  };

  const handleCancelDate = () => {
    setTempDate(selectedDate);
    setShowDatePicker(false);
  };

  const handlePreviousDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    setSelectedDate(prev);
  };

  const handleNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    if (next <= new Date()) {
      setSelectedDate(next);
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

  const formatDate = (date: Date): string => {
    const dia = date.getDate().toString().padStart(2, "0");
    const mes = (date.getMonth() + 1).toString().padStart(2, "0");
    const año = date.getFullYear();
    return `${dia}/${mes}/${año}`;
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const roundMacro = (val: number) => Math.round(val);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: MetaFitColors.background.white }]} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
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

        {/* Date navigation */}
        <View style={styles.dateSection}>
          <ThemedText style={styles.dateLabel} lightColor={MetaFitColors.text.secondary}>
            Fecha seleccionada
          </ThemedText>
          <View style={styles.dateNavRow}>
            <TouchableOpacity style={styles.navArrow} onPress={handlePreviousDay} activeOpacity={0.7}>
              <IconSymbol name="chevron.left" size={18} color={MetaFitColors.button.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dateButton}
              onPress={handleOpenDatePicker}
              activeOpacity={0.8}
            >
              <IconSymbol name="calendar" size={18} color={MetaFitColors.button.primary} />
              <ThemedText style={styles.dateButtonText} lightColor={MetaFitColors.text.primary}>
                {isToday(selectedDate) ? "Hoy" : formatDate(selectedDate)}
              </ThemedText>
            </TouchableOpacity>

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
        </View>

        {/* Date Picker */}
        {showDatePicker && (
          <>
            {Platform.OS === "ios" && (
              <View style={styles.iosDatePickerContainer}>
                <View style={styles.iosDatePickerHeader}>
                  <TouchableOpacity onPress={handleCancelDate} style={styles.iosDatePickerButton}>
                    <ThemedText style={styles.iosDatePickerCancelText} lightColor={MetaFitColors.text.secondary}>
                      Cancelar
                    </ThemedText>
                  </TouchableOpacity>
                  <ThemedText style={styles.iosPickerTitle} lightColor={MetaFitColors.text.primary}>
                    Seleccionar fecha
                  </ThemedText>
                  <TouchableOpacity onPress={handleAcceptDate} style={styles.iosDatePickerButton}>
                    <ThemedText style={styles.iosDatePickerAcceptText} lightColor={MetaFitColors.button.primary}>
                      Aceptar
                    </ThemedText>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                  style={styles.iosDatePicker}
                />
              </View>
            )}
            {Platform.OS === "android" && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="default"
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}
          </>
        )}

        {/* Macro summary card */}
        {!isLoading && resumen && resumen.totalRegistros > 0 && (
          <View style={styles.macroCard}>
            <ThemedText style={styles.macroCardTitle} lightColor={MetaFitColors.text.primary}>
              Resumen nutricional
            </ThemedText>
            <View style={styles.macroRow}>
              <View style={styles.macroItem}>
                <ThemedText style={styles.macroValue} lightColor={MetaFitColors.button.primary}>
                  {roundMacro(resumen.energia)}
                </ThemedText>
                <ThemedText style={styles.macroLabel} lightColor={MetaFitColors.text.secondary}>
                  kcal
                </ThemedText>
              </View>
              <View style={styles.macroDivider} />
              <View style={styles.macroItem}>
                <ThemedText style={styles.macroValue} lightColor={MetaFitColors.text.primary}>
                  {roundMacro(resumen.carb)}g
                </ThemedText>
                <ThemedText style={styles.macroLabel} lightColor={MetaFitColors.text.secondary}>
                  Carbos
                </ThemedText>
              </View>
              <View style={styles.macroDivider} />
              <View style={styles.macroItem}>
                <ThemedText style={styles.macroValue} lightColor={MetaFitColors.text.primary}>
                  {roundMacro(resumen.proteina)}g
                </ThemedText>
                <ThemedText style={styles.macroLabel} lightColor={MetaFitColors.text.secondary}>
                  Proteína
                </ThemedText>
              </View>
              <View style={styles.macroDivider} />
              <View style={styles.macroItem}>
                <ThemedText style={styles.macroValue} lightColor={MetaFitColors.text.primary}>
                  {roundMacro(resumen.grasa)}g
                </ThemedText>
                <ThemedText style={styles.macroLabel} lightColor={MetaFitColors.text.secondary}>
                  Grasa
                </ThemedText>
              </View>
            </View>
          </View>
        )}

        {/* Consumos section */}
        <View style={styles.consumosSection}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle} lightColor={MetaFitColors.text.primary}>
              Consumos del {isToday(selectedDate) ? "día de hoy" : formatDate(selectedDate)}
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
            onEditar={handleEditar}
            onEliminar={handleEliminar}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 110,
  },
  pageHeader: {
    marginBottom: 28,
  },
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
  pageSubtitle: {
    fontSize: 15,
  },
  dateSection: {
    marginBottom: 16,
    gap: 8,
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  dateNavRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  navArrow: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: MetaFitColors.background.card,
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
    alignItems: "center",
    justifyContent: "center",
  },
  navArrowDisabled: {
    opacity: 0.35,
  },
  dateButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: MetaFitColors.background.card,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
  },
  dateButtonText: {
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
  },
  iosDatePickerContainer: {
    backgroundColor: MetaFitColors.background.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
    marginBottom: 16,
    overflow: "hidden",
  },
  iosDatePickerHeader: {
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
  iosDatePickerButton: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  iosDatePickerCancelText: {
    fontSize: 15,
    fontWeight: "500",
  },
  iosDatePickerAcceptText: {
    fontSize: 15,
    fontWeight: "700",
  },
  iosDatePicker: {
    height: 200,
  },
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
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
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
  consumosSection: {
    flex: 1,
  },
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
