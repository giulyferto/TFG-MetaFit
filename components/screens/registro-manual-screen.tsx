import { BuscarComidasAnteriores } from "@/components/formulario-comida/BuscarComidasAnteriores";
import { DetallesComidaCard, type DatosComida } from "@/components/formulario-comida/DetallesComidaCard";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { MetaFitColors } from "@/constants/theme";
import { guardarComidaComoPlantilla, guardarComidaEnDiario, type ComidaAnterior } from "@/utils/comidas";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

type TipoComida = "Desayuno" | "Almuerzo" | "Cena" | "Snack" | "Otro";

type RegistroManualScreenProps = {
  onAgregarAlDiarioPress?: (datosComida: DatosComida, tipoComida: string, registroComidaId: string) => void;
  onCancelarPress?: () => void;
};

export function RegistroManualScreen({
  onAgregarAlDiarioPress,
  onCancelarPress,
}: RegistroManualScreenProps) {
  const [tipoComidaSeleccionado, setTipoComidaSeleccionado] =
    useState<TipoComida | null>(null);
  const [comidasSeleccionadas, setComidasSeleccionadas] = useState<string[]>([]);
  const [comidaSeleccionadaId, setComidaSeleccionadaId] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [guardarComida, setGuardarComida] = useState(false);
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

  const handleComidaSeleccionada = (comida: ComidaAnterior) => {
    // Cuando se selecciona una comida, llenar el formulario con sus datos
    setDatosComida({
      nombre: comida.nombre || "",
      cantidad: comida.cantidad || "",
      energia: comida.energia || "",
      carb: comida.carb || "",
      proteina: comida.proteina || "",
      fibra: comida.fibra || "",
      grasa: comida.grasa || "",
    });
    
    // Guardar el ID de la comida seleccionada para usarlo en el registro
    // Esto ya se maneja en onComidasSeleccionadasChange, pero lo mantenemos por si acaso
    setComidaSeleccionadaId(comida.id);
    
    // Si la comida tiene tipo, seleccionarlo también
    if (comida.tipoComida && tiposComida.includes(comida.tipoComida as TipoComida)) {
      setTipoComidaSeleccionado(comida.tipoComida as TipoComida);
    }
  };

  const handleAgregarAlDiario = async () => {
    // Validar que haya un tipo de comida seleccionado
    if (!tipoComidaSeleccionado) {
      Alert.alert("Error", "Por favor selecciona un tipo de comida");
      return;
    }

    // Validar que haya datos de comida (nombre mínimo)
    if (!datosComida.nombre || datosComida.nombre.trim() === "") {
      Alert.alert("Error", "Por favor ingresa el nombre de la comida");
      return;
    }

    setIsSaving(true);

    try {
      let registroComidaId: string;
      
      // Si hay una comida seleccionada del dropdown, usar su ID directamente
      if (comidaSeleccionadaId) {
        // Usar el ID de la comida seleccionada sin guardarla nuevamente
        registroComidaId = await guardarComidaEnDiario(datosComida, tipoComidaSeleccionado, comidaSeleccionadaId);
      } else if (guardarComida) {
        // Si el checkbox está marcado y no hay comida seleccionada, guardar como nueva plantilla
        const comidaId = await guardarComidaComoPlantilla(datosComida);
        registroComidaId = await guardarComidaEnDiario(datosComida, tipoComidaSeleccionado, comidaId);
      } else {
        // Si no está marcado y no hay comida seleccionada, solo guardar el registro sin plantilla
        registroComidaId = await guardarComidaEnDiario(datosComida, tipoComidaSeleccionado);
      }
      
      // Si hay una función callback, llamarla con los datos de la comida, el tipo y el ID del registro
      if (onAgregarAlDiarioPress) {
        onAgregarAlDiarioPress(datosComida, tipoComidaSeleccionado, registroComidaId);
      } else {
        // Navegar a la pantalla de feedback con los datos de la comida
        router.push({
          pathname: "/feedback",
          params: {
            nombre: datosComida.nombre || "",
            cantidad: datosComida.cantidad || "",
            energia: datosComida.energia || "",
            carb: datosComida.carb || "",
            proteina: datosComida.proteina || "",
            fibra: datosComida.fibra || "",
            grasa: datosComida.grasa || "",
            tipoComida: tipoComidaSeleccionado || "",
            registroComidaId: registroComidaId || "",
          },
        });
      }
    } catch (error: any) {
      console.error("Error al guardar comida:", error);
      Alert.alert(
        "Error",
        `No se pudo guardar la comida: ${error.message || "Error desconocido"}`
      );
    } finally {
      setIsSaving(false);
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

        {/* Buscar comidas anteriores */}
        <BuscarComidasAnteriores
          comidasSeleccionadas={comidasSeleccionadas}
          onComidasSeleccionadasChange={(ids) => {
            setComidasSeleccionadas(ids);
            // Actualizar el ID de la comida seleccionada
            if (ids.length === 0) {
              // Si se deselecciona la comida, limpiar el ID
              setComidaSeleccionadaId(null);
            } else {
              // Si hay comidas seleccionadas, usar la última seleccionada (o la primera)
              // En este caso usamos la última para que sea la más reciente
              setComidaSeleccionadaId(ids[ids.length - 1]);
            }
          }}
          onComidaSeleccionada={handleComidaSeleccionada}
          onDropdownToggle={setIsDropdownOpen}
        />

        {/* Tarjeta de detalles de comida - Solo mostrar si el dropdown no está abierto y no hay comidas seleccionadas */}
        {!isDropdownOpen && comidasSeleccionadas.length === 0 && (
          <>
            <DetallesComidaCard
              datos={datosComida}
              onDatosChange={setDatosComida}
            />

            {/* Checkbox para guardar comida como plantilla */}
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setGuardarComida(!guardarComida)}
              activeOpacity={0.7}
            >
              <View style={styles.checkbox}>
                {guardarComida && (
                  <View style={styles.checkboxChecked}>
                    <IconSymbol
                      name="checkmark"
                      size={16}
                      color={MetaFitColors.text.white}
                    />
                  </View>
                )}
              </View>
              <ThemedText style={styles.checkboxLabel} lightColor={MetaFitColors.text.primary}>
                Guardar comida
              </ThemedText>
            </TouchableOpacity>
          </>
        )}

        {/* Botones de acción */}
        <TouchableOpacity
          style={[styles.agregarButton, isSaving && styles.agregarButtonDisabled]}
          onPress={handleAgregarAlDiario}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={MetaFitColors.text.white} />
          ) : (
            <ThemedText style={styles.agregarButtonText} lightColor={MetaFitColors.text.white}>
              Agregar al diario
            </ThemedText>
          )}
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
  agregarButtonDisabled: {
    opacity: 0.6,
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
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    paddingVertical: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: MetaFitColors.border.light,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: MetaFitColors.background.white,
  },
  checkboxChecked: {
    width: "100%",
    height: "100%",
    borderRadius: 4,
    backgroundColor: MetaFitColors.button.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
});

