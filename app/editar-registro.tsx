import { DetallesComidaCard, type DatosComida } from "@/components/formulario-comida/DetallesComidaCard";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { MetaFitColors } from "@/constants/theme";
import { actualizarRegistroComida, eliminarFeedbackDeRegistro } from "@/utils/consumos";
import { obtenerNutricionIngrediente } from "@/utils/openai";
import type { IngredienteGuardado } from "@/utils/comidas";
import { seleccionarImagen } from "@/utils/image";
import { consumePendingImagenUrl } from "@/utils/nav-state";
import { subirImagenComida } from "@/utils/storage";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";

type TipoComida = "Desayuno" | "Almuerzo" | "Cena" | "Snack" | "Otro";
const TIPOS_COMIDA: TipoComida[] = ["Desayuno", "Almuerzo", "Cena", "Snack", "Otro"];

function calIngrediente(ing: IngredienteGuardado) {
  const p = parseFloat(ing.peso) || 0;
  return Math.round(ing.energiaPor100g * p / 100);
}

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
    ingredientesJson?: string;
  }>();

  const ingredientesIniciales: IngredienteGuardado[] = (() => {
    if (!params.ingredientesJson) return [];
    try { return JSON.parse(params.ingredientesJson); } catch { return []; }
  })();

  const tieneIngredientes = ingredientesIniciales.length > 0;

  const [nombreEditable, setNombreEditable] = useState(params.nombre || "");

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

  const [currentImageUrl] = useState<string | null>(() => consumePendingImagenUrl());
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  const [imageFailed, setImageFailed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const displayUri = localImageUri ?? currentImageUrl;
  const showImage = !!displayUri && !imageFailed;
  const fotoLabel = displayUri ? "Cambiar foto" : "Agregar foto";

  const handleSeleccionarImagen = async () => {
    await seleccionarImagen(({ uri }) => {
      setLocalImageUri(uri);
      setImageFailed(false);
    });
  };

  const handleCalcularConIA = async () => {
    const nombre = datosComida.nombre?.trim();
    if (!nombre) {
      Alert.alert("Error", "Por favor ingresa el nombre de la comida antes de calcular");
      return;
    }
    const gramos = parseFloat(datosComida.cantidad || "0");
    if (!gramos || gramos <= 0) {
      Alert.alert("Error", "Por favor ingresa la cantidad en gramos antes de calcular");
      return;
    }
    try {
      const nutricion = await obtenerNutricionIngrediente(nombre);
      setDatosComida((prev) => ({
        ...prev,
        energia: String(Math.round(nutricion.energiaPor100g * gramos / 100)),
        carb: String(Math.round(nutricion.carbPor100g * gramos / 100 * 10) / 10),
        proteina: String(Math.round(nutricion.proteinaPor100g * gramos / 100 * 10) / 10),
        fibra: String(Math.round(nutricion.fibraPor100g * gramos / 100 * 10) / 10),
        grasa: String(Math.round(nutricion.grasaPor100g * gramos / 100 * 10) / 10),
      }));
    } catch (error: any) {
      Alert.alert("Error", `No se pudieron calcular los valores: ${error.message || "Error desconocido"}`);
    }
  };

  const datosCambiaron = (): boolean => {
    const tipoOriginal = TIPOS_COMIDA.includes(params.tipoComida as TipoComida)
      ? (params.tipoComida as TipoComida)
      : null;
    if (tipoComida !== tipoOriginal) return true;

    if (tieneIngredientes) {
      return nombreEditable.trim() !== (params.nombre || "").trim();
    }

    return (
      datosComida.nombre !== (params.nombre || "") ||
      datosComida.cantidad !== (params.cantidad || "") ||
      datosComida.energia !== (params.energia || "") ||
      datosComida.carb !== (params.carb || "") ||
      datosComida.proteina !== (params.proteina || "") ||
      datosComida.fibra !== (params.fibra || "") ||
      datosComida.grasa !== (params.grasa || "")
    );
  };

  const handleGuardar = async () => {
    const nombreFinal = tieneIngredientes ? nombreEditable.trim() : datosComida.nombre.trim();
    if (!nombreFinal) {
      Alert.alert("Error", "Por favor ingresa el nombre de la comida");
      return;
    }

    const imagenCambio = !!localImageUri;
    const hayOtrosCambios = datosCambiaron();

    if (!imagenCambio && !hayOtrosCambios) {
      router.back();
      return;
    }

    setIsSaving(true);
    try {
      const datosFinales = tieneIngredientes
        ? { ...datosComida, nombre: nombreFinal }
        : datosComida;

      let imagenUrlFinal: string | undefined;
      if (imagenCambio) {
        imagenUrlFinal = await subirImagenComida(localImageUri!, params.registroId);
      }

      if (hayOtrosCambios) {
        await eliminarFeedbackDeRegistro(params.registroId);
      }

      await actualizarRegistroComida(params.registroId, {
        ...datosFinales,
        tipoComida: tipoComida || undefined,
        ...(tieneIngredientes ? { ingredientes: ingredientesIniciales } : {}),
        ...(imagenUrlFinal ? { imagenUrl: imagenUrlFinal } : {}),
      });

      if (hayOtrosCambios) {
        router.replace({
          pathname: "/feedback",
          params: {
            nombre: datosFinales.nombre || "",
            cantidad: datosFinales.cantidad || "",
            energia: datosFinales.energia || "",
            carb: datosFinales.carb || "",
            proteina: datosFinales.proteina || "",
            fibra: datosFinales.fibra || "",
            grasa: datosFinales.grasa || "",
            tipoComida: tipoComida || "",
            registroComidaId: params.registroId || "",
            ingredientesJson: tieneIngredientes ? JSON.stringify(ingredientesIniciales) : "",
          },
        });
      } else {
        router.back();
      }
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

        {/* Imagen */}
        {showImage ? (
          <TouchableOpacity
            style={styles.heroImageContainer}
            onPress={handleSeleccionarImagen}
            activeOpacity={0.85}
          >
            <Image
              source={{ uri: displayUri! }}
              style={styles.heroImage}
              contentFit="cover"
              onError={() => setImageFailed(true)}
              transition={300}
            />
            <View style={styles.heroImageOverlay}>
              <IconSymbol name="camera.fill" size={14} color="#fff" />
              <ThemedText style={styles.heroImageOverlayText} lightColor="#fff">
                Cambiar foto
              </ThemedText>
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.agregarFotoButton}
            onPress={handleSeleccionarImagen}
            activeOpacity={0.75}
          >
            <IconSymbol name="camera" size={16} color={MetaFitColors.button.primary} />
            <ThemedText style={styles.agregarFotoText} lightColor={MetaFitColors.button.primary}>
              {fotoLabel}
            </ThemedText>
          </TouchableOpacity>
        )}

        {tieneIngredientes ? (
          /* ── Vista de desglose por ingredientes ── */
          <>
            {/* Nombre editable */}
            <View style={styles.titleCard}>
              <TextInput
                style={styles.tituloInput}
                value={nombreEditable}
                onChangeText={setNombreEditable}
                placeholder="Nombre del plato"
                placeholderTextColor={MetaFitColors.text.tertiary}
                autoCapitalize="sentences"
                returnKeyType="done"
              />
            </View>

            {/* Calorías totales */}
            <View style={styles.calorieCard}>
              <View style={styles.calorieIconWrapper}>
                <IconSymbol name="flame.fill" size={24} color={MetaFitColors.button.primary} />
              </View>
              <View>
                <ThemedText style={styles.calorieLabel} lightColor={MetaFitColors.text.secondary}>
                  Calorías
                </ThemedText>
                <ThemedText style={styles.calorieValue} lightColor={MetaFitColors.text.primary}>
                  {datosComida.energia || "0"}
                </ThemedText>
              </View>
            </View>

            {/* Macros chips */}
            <View style={styles.macroChipsRow}>
              {[
                { label: "Proteína", value: datosComida.proteina, color: "#E8636A" },
                { label: "Carbos",   value: datosComida.carb,      color: "#F5A623" },
                { label: "Grasas",   value: datosComida.grasa,     color: MetaFitColors.button.primary },
              ].map(({ label, value, color }) => (
                <View key={label} style={styles.macroChip}>
                  <View style={[styles.macroChipDot, { backgroundColor: color }]} />
                  <ThemedText style={styles.macroChipLabel} lightColor={MetaFitColors.text.secondary}>
                    {label}
                  </ThemedText>
                  <ThemedText style={styles.macroChipValue} lightColor={MetaFitColors.text.primary}>
                    {value || "0"}g
                  </ThemedText>
                </View>
              ))}
            </View>

            {/* Lista de ingredientes */}
            <View style={styles.ingredientsSection}>
              <View style={styles.ingredientsHeader}>
                <ThemedText style={styles.ingredientsTitle} lightColor={MetaFitColors.text.primary}>
                  Ingredientes
                </ThemedText>
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: "/ingredientes",
                      params: {
                        nombre: nombreEditable || "",
                        ingredientesJson: params.ingredientesJson || "[]",
                        desdeManual: "true",
                        desdeEditar: "true",
                        registroId: params.registroId || "",
                        tipoComida: tipoComida || "",
                      },
                    })
                  }
                  style={styles.editIngBtn}
                >
                  <ThemedText style={styles.editIngBtnText} lightColor={MetaFitColors.button.primary}>
                    Editar
                  </ThemedText>
                </TouchableOpacity>
              </View>

              {ingredientesIniciales.map((ing, idx) => (
                <View key={idx} style={styles.ingRow}>
                  <ThemedText
                    style={styles.ingRowName}
                    lightColor={MetaFitColors.text.primary}
                    numberOfLines={1}
                  >
                    {ing.nombre}
                  </ThemedText>
                  <ThemedText style={styles.ingRowSep} lightColor={MetaFitColors.text.tertiary}>
                    {" · "}
                  </ThemedText>
                  <ThemedText style={styles.ingRowCal} lightColor={MetaFitColors.text.secondary}>
                    {calIngrediente(ing)} cal
                  </ThemedText>
                  <View style={styles.ingRowSpacer} />
                  <ThemedText style={styles.ingRowQty} lightColor={MetaFitColors.text.tertiary}>
                    {ing.peso}g
                  </ThemedText>
                </View>
              ))}
            </View>
          </>
        ) : (
          /* ── Vista estándar ── */
          <>
            <DetallesComidaCard
              datos={datosComida}
              onDatosChange={setDatosComida}
              onCalcularConIA={handleCalcularConIA}
            />

            {/* Separador "o" */}
            <View style={styles.separadorRow}>
              <View style={styles.separadorLinea} />
              <ThemedText style={styles.separadorTexto} lightColor={MetaFitColors.text.tertiary}>
                o
              </ThemedText>
              <View style={styles.separadorLinea} />
            </View>

            {/* Botón desglosar por ingredientes */}
            <TouchableOpacity
              style={styles.ingredientesButton}
              onPress={() =>
                router.push({
                  pathname: "/ingredientes",
                  params: {
                    nombre: datosComida.nombre || "",
                    ingredientesJson: "[]",
                    desdeManual: "true",
                    desdeEditar: "true",
                    registroId: params.registroId || "",
                    tipoComida: tipoComida || "",
                  },
                })
              }
              activeOpacity={0.75}
            >
              <IconSymbol name="list.bullet" size={16} color={MetaFitColors.button.primary} />
              <ThemedText style={styles.ingredientesButtonText} lightColor={MetaFitColors.button.primary}>
                Desglosar por ingredientes
              </ThemedText>
            </TouchableOpacity>
          </>
        )}

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
    marginBottom: 20,
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
  // Imagen
  heroImageContainer: {
    width: "100%",
    height: 200,
    borderRadius: 18,
    marginBottom: 16,
    overflow: "hidden",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroImageOverlay: {
    position: "absolute",
    bottom: 10,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  heroImageOverlayText: {
    fontSize: 12,
    fontWeight: "600",
  },
  agregarFotoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: MetaFitColors.background.elevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: MetaFitColors.border.accent,
    borderStyle: "dashed",
    paddingVertical: 14,
    marginBottom: 16,
  },
  agregarFotoText: {
    fontSize: 14,
    fontWeight: "700",
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
  // Estándar: separador + botón ingredientes
  separadorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  separadorLinea: {
    flex: 1,
    height: 1,
    backgroundColor: MetaFitColors.border.light,
  },
  separadorTexto: {
    fontSize: 13,
    fontWeight: "500",
  },
  ingredientesButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: MetaFitColors.background.elevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: MetaFitColors.border.accent,
    borderStyle: "dashed",
    paddingVertical: 14,
    marginBottom: 16,
  },
  ingredientesButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
  // Vista desglose por ingredientes
  titleCard: {
    backgroundColor: MetaFitColors.background.card,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
  },
  tituloInput: {
    fontSize: 16,
    fontWeight: "600",
    color: MetaFitColors.text.primary,
  },
  calorieCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: MetaFitColors.background.card,
    borderRadius: 14,
    padding: 20,
    marginBottom: 12,
    gap: 16,
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  calorieIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: MetaFitColors.background.elevated,
    alignItems: "center",
    justifyContent: "center",
  },
  calorieLabel: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 2,
  },
  calorieValue: {
    fontSize: 40,
    fontWeight: "800",
    letterSpacing: -1,
    lineHeight: 50,
  },
  macroChipsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  macroChip: {
    flex: 1,
    backgroundColor: MetaFitColors.background.card,
    borderRadius: 12,
    padding: 12,
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
  },
  macroChipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 6,
  },
  macroChipLabel: {
    fontSize: 11,
    fontWeight: "500",
    marginBottom: 2,
  },
  macroChipValue: {
    fontSize: 15,
    fontWeight: "700",
  },
  ingredientsSection: {
    backgroundColor: MetaFitColors.background.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
  },
  ingredientsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  ingredientsTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  editIngBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: MetaFitColors.background.elevated,
  },
  editIngBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  ingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: MetaFitColors.border.light,
  },
  ingRowName: {
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 1,
  },
  ingRowSep: {
    fontSize: 14,
  },
  ingRowCal: {
    fontSize: 13,
    fontWeight: "500",
  },
  ingRowSpacer: {
    flex: 1,
  },
  ingRowQty: {
    fontSize: 13,
    fontWeight: "500",
  },
});
