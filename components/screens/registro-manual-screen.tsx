import { DetallesComidaCard, type DatosComida } from "@/components/formulario-comida/DetallesComidaCard";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { MetaFitColors } from "@/constants/theme";
import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

type TipoComida = "Desayuno" | "Almuerzo" | "Cena" | "Snack" | "Otro";

type RegistroManualScreenProps = {
  onAgregarAlDiarioPress?: () => void;
  onCancelarPress?: () => void;
};

export function RegistroManualScreen({
  onAgregarAlDiarioPress,
  onCancelarPress,
}: RegistroManualScreenProps) {
  const [tipoComidaSeleccionado, setTipoComidaSeleccionado] =
    useState<TipoComida | null>(null);
  const [datosComida, setDatosComida] = useState<DatosComida>({
    nombre: "",
    cantidad: "",
    energia: "",
    carb: "",
    proteina: "",
    fibra: "",
    grasa: "",
  });

  const tiposComida: TipoComida[] = ["Desayuno", "Almuerzo", "Cena", "Snack", "Otro"];

  const handleAgregarAlDiario = () => {
    if (onAgregarAlDiarioPress) {
      onAgregarAlDiarioPress();
    } else {
      // Aquí irá la lógica para agregar al diario cuando se integre Firebase
      console.log("Agregar al diario");
      router.back();
    }
  };

  const handleCancelar = () => {
    if (onCancelarPress) {
      onCancelarPress();
    } else {
      router.back();
    }
  };

  return (
    <ThemedView style={styles.container} lightColor={MetaFitColors.background.white}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol
            name="chevron.left"
            size={24}
            color={MetaFitColors.text.primary}
          />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle} lightColor={MetaFitColors.text.primary}>
          Comida
        </ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Selector de tipo de comida */}
        <View style={styles.tipoComidaContainer}>
          {tiposComida.map((tipo) => (
            <TouchableOpacity
              key={tipo}
              style={[
                styles.tipoComidaButton,
                tipoComidaSeleccionado === tipo && styles.tipoComidaButtonActive,
              ]}
              onPress={() => setTipoComidaSeleccionado(tipo)}
            >
              <ThemedText
                style={[
                  styles.tipoComidaText,
                  tipoComidaSeleccionado === tipo && styles.tipoComidaTextActive,
                ]}
                lightColor={
                  tipoComidaSeleccionado === tipo
                    ? MetaFitColors.text.white
                    : MetaFitColors.text.secondary
                }
              >
                {tipo}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tarjeta de detalles de comida */}
        <DetallesComidaCard
          datos={datosComida}
          onDatosChange={setDatosComida}
        />

        {/* Botones de acción */}
        <TouchableOpacity
          style={styles.agregarButton}
          onPress={handleAgregarAlDiario}
        >
          <ThemedText style={styles.agregarButtonText} lightColor={MetaFitColors.text.white}>
            Agregar al diario
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelarButton} onPress={handleCancelar}>
          <ThemedText
            style={styles.cancelarButtonText}
            lightColor={MetaFitColors.button.primary}
          >
            Cancelar
          </ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MetaFitColors.background.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: MetaFitColors.border.divider,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    flex: 1,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  tipoComidaContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
    flexWrap: "wrap",
  },
  tipoComidaButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: MetaFitColors.border.divider,
    minWidth: 80,
    alignItems: "center",
  },
  tipoComidaButtonActive: {
    backgroundColor: MetaFitColors.button.primary,
  },
  tipoComidaText: {
    fontSize: 14,
    fontWeight: "500",
  },
  tipoComidaTextActive: {
    color: MetaFitColors.text.white,
  },
  agregarButton: {
    backgroundColor: MetaFitColors.button.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  agregarButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: MetaFitColors.text.white,
  },
  cancelarButton: {
    backgroundColor: MetaFitColors.button.secondary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelarButtonText: {
    fontSize: 18,
    fontWeight: "600",
  },
});

