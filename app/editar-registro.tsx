import { DetallesComidaCard, type DatosComida } from "@/components/formulario-comida/DetallesComidaCard";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { MetaFitColors } from "@/constants/theme";
import { actualizarRegistroComida } from "@/utils/consumos";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

type TipoComida = "Desayuno" | "Almuerzo" | "Cena" | "Snack" | "Otro";
const TIPOS_COMIDA: TipoComida[] = ["Desayuno", "Almuerzo", "Cena", "Snack", "Otro"];

export default function EditarRegistroPage() {
  const params = useLocalSearchParams<{
    registroId: string;
    nombre?: string;
    cantidad?: string;
    energia?: string;
    carb?: string;
    proteina?: string;
    fibra?: string;
    grasa?: string;
    tipoComida?: string;
  }>();

  const [datosComida, setDatosComida] = useState<DatosComida>({
    nombre: params.nombre || "",
    cantidad: params.cantidad || "",
    energia: params.energia || "",
    carb: params.carb || "",
    proteina: params.proteina || "",
    fibra: params.fibra || "",
    grasa: params.grasa || "",
  });

  const [tipoComida, setTipoComida] = useState<TipoComida | null>(
    TIPOS_COMIDA.includes(params.tipoComida as TipoComida)
      ? (params.tipoComida as TipoComida)
      : null
  );

  const [isSaving, setIsSaving] = useState(false);

  const handleGuardar = async () => {
    if (!datosComida.nombre.trim()) {
      Alert.alert("Error", "Por favor ingresa el nombre de la comida");
      return;
    }

    setIsSaving(true);
    try {
      await actualizarRegistroComida(params.registroId, {
        ...datosComida,
        tipoComida: tipoComida || undefined,
      });
      router.back();
    } catch (error: any) {
      Alert.alert("Error", `No se pudo guardar: ${error.message || "Error desconocido"}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ThemedView style={styles.container} lightColor={MetaFitColors.background.white}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={20} color={MetaFitColors.text.secondary} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle} lightColor={MetaFitColors.text.primary}>
          Editar registro
        </ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Tipo de comida */}
        <View style={styles.tipoComidaContainer}>
          {TIPOS_COMIDA.map((tipo) => (
            <TouchableOpacity
              key={tipo}
              style={[
                styles.tipoComidaButton,
                tipoComida === tipo && styles.tipoComidaButtonActive,
              ]}
              onPress={() => setTipoComida(tipo)}
            >
              <ThemedText
                style={[
                  styles.tipoComidaText,
                  tipoComida === tipo && styles.tipoComidaTextActive,
                ]}
                lightColor={
                  tipoComida === tipo ? MetaFitColors.button.primary : MetaFitColors.text.secondary
                }
              >
                {tipo}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        <DetallesComidaCard datos={datosComida} onDatosChange={setDatosComida} />

        <TouchableOpacity
          style={[styles.guardarButton, isSaving && styles.guardarButtonDisabled]}
          onPress={handleGuardar}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={MetaFitColors.text.white} />
          ) : (
            <ThemedText style={styles.guardarButtonText} lightColor={MetaFitColors.text.white}>
              Guardar cambios
            </ThemedText>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelarButton} onPress={() => router.back()}>
          <ThemedText style={styles.cancelarButtonText} lightColor={MetaFitColors.button.primary}>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
  },
  headerSpacer: {
    width: 48,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  tipoComidaContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
    flexWrap: "wrap",
  },
  tipoComidaButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: MetaFitColors.background.card,
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
    minWidth: 80,
    alignItems: "center",
  },
  tipoComidaButtonActive: {
    backgroundColor: MetaFitColors.background.elevated,
    borderColor: MetaFitColors.button.primary,
  },
  tipoComidaText: {
    fontSize: 13,
    fontWeight: "600",
  },
  tipoComidaTextActive: {
    color: MetaFitColors.button.primary,
  },
  guardarButton: {
    backgroundColor: MetaFitColors.button.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#2C3E50",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  guardarButtonDisabled: {
    opacity: 0.5,
  },
  guardarButtonText: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  cancelarButton: {
    backgroundColor: MetaFitColors.background.card,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
  },
  cancelarButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
