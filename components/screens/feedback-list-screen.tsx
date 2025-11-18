import { TablaConsumos } from "@/components/tabla-consumos/TablaConsumos";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { MetaFitColors } from "@/constants/theme";
import { obtenerConsumosPorFecha, type Consumo } from "@/utils/consumos";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Platform, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

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

  // Inicializar tempDate cuando se muestra el picker
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
      // iOS - guardar temporalmente mientras el usuario selecciona
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

  return (
    <ThemedView style={styles.container} lightColor={MetaFitColors.background.white}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Date Picker */}
        <View style={styles.datePickerContainer}>
          <ThemedText style={styles.dateLabel} lightColor={MetaFitColors.text.primary}>
            Seleccionar fecha:
          </ThemedText>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={handleOpenDatePicker}
          >
            <ThemedText style={styles.dateButtonText} lightColor={MetaFitColors.text.primary}>
              {formatDate(selectedDate)}
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Date Picker Modal */}
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
                      style={styles.iosDatePickerButtonText}
                      lightColor={MetaFitColors.button.primary}
                    >
                      Cancelar
                    </ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleAcceptDate}
                    style={styles.iosDatePickerButton}
                  >
                    <ThemedText
                      style={styles.iosDatePickerButtonText}
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

        {/* Tabla de consumos */}
        <View style={styles.consumosSection}>
          <ThemedText style={styles.sectionTitle} lightColor={MetaFitColors.text.primary}>
            Consumos del {formatDate(selectedDate)}
          </ThemedText>

          <TablaConsumos consumos={consumos} isLoading={isLoading} />
        </View>
      </ScrollView>
    </ThemedView>
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
    padding: 20,
    paddingBottom: 100,
  },
  datePickerContainer: {
    marginTop: 100,
    marginBottom: 20,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  dateButton: {
    backgroundColor: MetaFitColors.button.secondary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
  },
  dateButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  consumosSection: {
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  iosDatePickerContainer: {
    backgroundColor: MetaFitColors.background.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
    marginTop: 10,
    marginBottom: 10,
  },
  iosDatePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: MetaFitColors.border.light,
  },
  iosDatePickerButton: {
    paddingVertical: 8,
  },
  iosDatePickerButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  iosDatePicker: {
    height: 200,
  },
});

