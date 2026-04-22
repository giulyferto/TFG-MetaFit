import { TablaConsumos } from "@/components/tabla-consumos/TablaConsumos";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ThemedText } from "@/components/ui/themed-text";
import { MetaFitColors } from "@/constants/theme";
import { obtenerConsumosPorFecha, type Consumo } from "@/utils/consumos";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Platform, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function FeedbackListScreen() {
  const [consumos, setConsumos] = useState<Consumo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [tempDate, setTempDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

  const cargarConsumos = useCallback(async () => {
    try {
      setIsLoading(true);
      const consumosFiltrados = await obtenerConsumosPorFecha(selectedDate);
      setConsumos(consumosFiltrados);
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: MetaFitColors.background.white }]} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.pageHeader}>
          <ThemedText style={styles.pageTitle} lightColor={MetaFitColors.text.primary}>
            Historial
          </ThemedText>
          <ThemedText style={styles.pageSubtitle} lightColor={MetaFitColors.text.secondary}>
            Revisa tus consumos por fecha
          </ThemedText>
        </View>

        {/* Date selector */}
        <View style={styles.dateSection}>
          <ThemedText style={styles.dateLabel} lightColor={MetaFitColors.text.secondary}>
            Fecha seleccionada
          </ThemedText>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={handleOpenDatePicker}
            activeOpacity={0.8}
          >
            <IconSymbol
              name="calendar"
              size={18}
              color={MetaFitColors.button.primary}
            />
            <ThemedText style={styles.dateButtonText} lightColor={MetaFitColors.text.primary}>
              {isToday(selectedDate) ? "Hoy" : formatDate(selectedDate)}
            </ThemedText>
            <View style={styles.dateBadge}>
              <ThemedText style={styles.dateBadgeText} lightColor={MetaFitColors.text.secondary}>
                {formatDate(selectedDate)}
              </ThemedText>
            </View>
          </TouchableOpacity>
        </View>

        {/* Date Picker */}
        {showDatePicker && (
          <>
            {Platform.OS === "ios" && (
              <View style={styles.iosDatePickerContainer}>
                <View style={styles.iosDatePickerHeader}>
                  <TouchableOpacity
                    onPress={handleCancelDate}
                    style={styles.iosDatePickerButton}
                  >
                    <ThemedText
                      style={styles.iosDatePickerCancelText}
                      lightColor={MetaFitColors.text.secondary}
                    >
                      Cancelar
                    </ThemedText>
                  </TouchableOpacity>
                  <ThemedText style={styles.iosPickerTitle} lightColor={MetaFitColors.text.primary}>
                    Seleccionar fecha
                  </ThemedText>
                  <TouchableOpacity
                    onPress={handleAcceptDate}
                    style={styles.iosDatePickerButton}
                  >
                    <ThemedText
                      style={styles.iosDatePickerAcceptText}
                      lightColor={MetaFitColors.button.primary}
                    >
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

          <TablaConsumos consumos={consumos} isLoading={isLoading} />
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
    marginBottom: 24,
    gap: 8,
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: MetaFitColors.background.card,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
  },
  dateButtonText: {
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
  },
  dateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: MetaFitColors.background.elevated,
  },
  dateBadgeText: {
    fontSize: 12,
    fontWeight: "500",
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
