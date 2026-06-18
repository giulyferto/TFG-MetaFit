import { BuscarComidasAnteriores } from "@/components/formulario-comida/BuscarComidasAnteriores";
import { DetallesComidaCard, type DatosComida } from "@/components/formulario-comida/DetallesComidaCard";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { MetaFitColors } from "@/constants/theme";
import { guardarComidaComoPlantilla, guardarComidaEnDiario, type ComidaAnterior, type IngredienteGuardado } from "@/utils/comidas";
import { seleccionarImagen } from "@/utils/image";
import { setPendingImagenUrl } from "@/utils/nav-state";
import { obtenerNutricionIngrediente } from "@/utils/openai";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Image, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";

type TipoComida = "Desayuno" | "Almuerzo" | "Cena" | "Snack" | "Otro";

type RegistroManualScreenProps = {
  datosIniciales?: DatosComida;
  imagenUri?: string;
  ingredientes?: IngredienteGuardado[];
  tipoComidaInicial?: string;
  fechaInicial?: Date;
  onAgregarAlDiarioPress?: (datosComida: DatosComida, tipoComida: string, registroComidaId: string, ingredientes?: IngredienteGuardado[]) => void;
  onCancelarPress?: () => void;
};

export function RegistroManualScreen({
  datosIniciales,
  imagenUri,
  ingredientes,
  tipoComidaInicial,
  fechaInicial,
  onAgregarAlDiarioPress,
  onCancelarPress,
}: RegistroManualScreenProps) {
  const tiposComida: TipoComida[] = ["Desayuno", "Almuerzo", "Cena", "Snack", "Otro"];
  const [tipoComidaSeleccionado, setTipoComidaSeleccionado] = useState<TipoComida | null>(
    tiposComida.includes(tipoComidaInicial as TipoComida) ? (tipoComidaInicial as TipoComida) : null
  );
  const [comidasSeleccionadas, setComidasSeleccionadas] = useState<string[]>([]);
  const [comidaSeleccionadaId, setComidaSeleccionadaId] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [guardarComida, setGuardarComida] = useState(false);
  const [datosComida, setDatosComida] = useState<DatosComida>(
    datosIniciales || {
      nombre: "",
      cantidad: "",
      energia: "",
      carb: "",
      proteina: "",
      fibra: "",
      grasa: "",
    }
  );

  const [localFotoUri, setLocalFotoUri] = useState<string | null>(null);

  const [fechaSeleccionada, setFechaSeleccionada] = useState<Date>(fechaInicial ?? new Date());
  const [tempFecha, setTempFecha] = useState<Date>(fechaInicial ?? new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const esHoy = (d: Date) => {
    const hoy = new Date();
    return d.getDate() === hoy.getDate() && d.getMonth() === hoy.getMonth() && d.getFullYear() === hoy.getFullYear();
  };
  const formatFecha = (d: Date) => {
    const dia = d.getDate().toString().padStart(2, "0");
    const mes = (d.getMonth() + 1).toString().padStart(2, "0");
    const anio = d.getFullYear();
    return `${dia}/${mes}/${anio}`;
  };

  const handleAgregarFoto = async () => {
    await seleccionarImagen(
      async (asset) => { setLocalFotoUri(asset.uri); },
      { title: "Foto del plato", message: "¿Cómo quieres agregar la foto?", allowsEditing: true, aspect: [4, 3] }
    );
  };

  // When ingredients are present, allow editing just the title
  const [nombreEditable, setNombreEditable] = useState(datosIniciales?.nombre || "");
  const [porciones, setPorciones] = useState(1);

  const macroIngrediente = (ing: IngredienteGuardado) => {
    const p = parseFloat(ing.peso) || 0;
    return {
      energia: Math.round(ing.energiaPor100g * p / 100),
      carb: Math.round(ing.carbPor100g * p / 100 * 10) / 10,
      proteina: Math.round(ing.proteinaPor100g * p / 100 * 10) / 10,
      fibra: Math.round(ing.fibraPor100g * p / 100 * 10) / 10,
      grasa: Math.round(ing.grasaPor100g * p / 100 * 10) / 10,
    };
  };

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

  const handleAgregarAlDiario = async () => {
    if (!tipoComidaSeleccionado) {
      Alert.alert("Error", "Por favor selecciona un tipo de comida");
      return;
    }

    // When using ingredient breakdown, validate the editable title
    const nombreFinal = ingredientes ? nombreEditable.trim() : datosComida.nombre?.trim();
    if (!nombreFinal) {
      Alert.alert("Error", "Por favor ingresa el nombre de la comida");
      return;
    }

    // Use the editable title + portion multiplier when ingredients are present
    const datosParaGuardar: DatosComida = ingredientes
      ? {
          nombre: nombreFinal,
          cantidad: datosComida.cantidad || "",
          energia: String(Math.round(parseFloat(datosComida.energia || "0") * porciones)),
          carb: String(Math.round(parseFloat(datosComida.carb || "0") * porciones * 10) / 10),
          proteina: String(Math.round(parseFloat(datosComida.proteina || "0") * porciones * 10) / 10),
          fibra: String(Math.round(parseFloat(datosComida.fibra || "0") * porciones * 10) / 10),
          grasa: String(Math.round(parseFloat(datosComida.grasa || "0") * porciones * 10) / 10),
        }
      : datosComida;

    setIsSaving(true);

    try {
      let registroComidaId: string;
      
      const fotoFinal = localFotoUri || imagenUri;
      if (comidaSeleccionadaId) {
        registroComidaId = await guardarComidaEnDiario(datosParaGuardar, tipoComidaSeleccionado, comidaSeleccionadaId, fotoFinal, ingredientes, fechaSeleccionada);
      } else if (guardarComida) {
        const comidaId = await guardarComidaComoPlantilla(datosParaGuardar);
        registroComidaId = await guardarComidaEnDiario(datosParaGuardar, tipoComidaSeleccionado, comidaId, fotoFinal, ingredientes, fechaSeleccionada);
      } else {
        registroComidaId = await guardarComidaEnDiario(datosParaGuardar, tipoComidaSeleccionado, undefined, fotoFinal, ingredientes, fechaSeleccionada);
      }

      setPendingImagenUrl(fotoFinal || null);

      if (onAgregarAlDiarioPress) {
        onAgregarAlDiarioPress(datosParaGuardar, tipoComidaSeleccionado, registroComidaId, ingredientes);
      } else {
        router.push({
          pathname: "/feedback",
          params: {
            nombre: datosParaGuardar.nombre || "",
            cantidad: datosParaGuardar.cantidad || "",
            energia: datosParaGuardar.energia || "",
            carb: datosParaGuardar.carb || "",
            proteina: datosParaGuardar.proteina || "",
            fibra: datosParaGuardar.fibra || "",
            grasa: datosParaGuardar.grasa || "",
            tipoComida: tipoComidaSeleccionado || "",
            registroComidaId: registroComidaId || "",
            ingredientesJson: ingredientes && ingredientes.length > 0 ? JSON.stringify(ingredientes) : "",
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
            size={20}
            color={MetaFitColors.text.secondary}
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

        {/* Selector de fecha */}
        <TouchableOpacity
          style={styles.fechaButton}
          onPress={() => { setTempFecha(fechaSeleccionada); setShowDatePicker(true); }}
          activeOpacity={0.8}
        >
          <IconSymbol name="calendar" size={16} color={MetaFitColors.button.primary} />
          <ThemedText style={styles.fechaButtonText} lightColor={MetaFitColors.text.primary}>
            {esHoy(fechaSeleccionada) ? "Hoy" : formatFecha(fechaSeleccionada)}
          </ThemedText>
        </TouchableOpacity>

        {/* DatePicker */}
        {showDatePicker && (
          <>
            {Platform.OS === "ios" && (
              <View style={styles.iosPickerContainer}>
                <View style={styles.iosPickerHeader}>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)} style={styles.iosPickerBtn}>
                    <ThemedText style={styles.iosPickerCancelText} lightColor={MetaFitColors.text.secondary}>
                      Cancelar
                    </ThemedText>
                  </TouchableOpacity>
                  <ThemedText style={styles.iosPickerTitle} lightColor={MetaFitColors.text.primary}>
                    Fecha del registro
                  </ThemedText>
                  <TouchableOpacity
                    onPress={() => { setFechaSeleccionada(tempFecha); setShowDatePicker(false); }}
                    style={styles.iosPickerBtn}
                  >
                    <ThemedText style={styles.iosPickerAceptarText} lightColor={MetaFitColors.button.primary}>
                      Aceptar
                    </ThemedText>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={tempFecha}
                  mode="date"
                  display="spinner"
                  maximumDate={new Date()}
                  onChange={(_, d) => d && setTempFecha(d)}
                  style={styles.iosPicker}
                />
              </View>
            )}
            {Platform.OS === "android" && (
              <DateTimePicker
                value={fechaSeleccionada}
                mode="date"
                display="default"
                maximumDate={new Date()}
                onChange={(e, d) => { setShowDatePicker(false); if (e.type === "set" && d) setFechaSeleccionada(d); }}
              />
            )}
          </>
        )}

        {/* ── Ingredient breakdown mode ── */}
        {ingredientes && ingredientes.length > 0 ? (
          <>
            {/* Food photo hero */}
            {(localFotoUri || imagenUri) && (
              <Image
                source={{ uri: localFotoUri || imagenUri }}
                style={styles.heroImage}
                resizeMode="cover"
              />
            )}

            {/* Title + servings stepper */}
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
              <View style={styles.stepper}>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => setPorciones(p => Math.max(0.5, parseFloat((p - 0.5).toFixed(1))))}
                >
                  <ThemedText style={styles.stepperBtnText} lightColor={MetaFitColors.text.primary}>−</ThemedText>
                </TouchableOpacity>
                <ThemedText style={styles.stepperValue} lightColor={MetaFitColors.text.primary}>{porciones}</ThemedText>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => setPorciones(p => parseFloat((p + 0.5).toFixed(1)))}
                >
                  <ThemedText style={styles.stepperBtnText} lightColor={MetaFitColors.text.primary}>+</ThemedText>
                </TouchableOpacity>
              </View>
            </View>

            {/* Calorie spotlight card */}
            <View style={styles.calorieCard}>
              <View style={styles.calorieIconWrapper}>
                <IconSymbol name="flame.fill" size={24} color={MetaFitColors.button.primary} />
              </View>
              <View>
                <ThemedText style={styles.calorieLabel} lightColor={MetaFitColors.text.secondary}>Calorías</ThemedText>
                <ThemedText style={styles.calorieValue} lightColor={MetaFitColors.text.primary}>
                  {Math.round(parseFloat(datosComida.energia || "0") * porciones)}
                </ThemedText>
              </View>
            </View>

            {/* Macro chips */}
            <View style={styles.macroChipsRow}>
              {[
                { label: "Proteína", value: datosComida.proteina, color: "#E8636A" },
                { label: "Carbos",   value: datosComida.carb,      color: "#F5A623" },
                { label: "Grasas",   value: datosComida.grasa,     color: MetaFitColors.button.primary },
              ].map(({ label, value, color }) => (
                <View key={label} style={styles.macroChip}>
                  <View style={[styles.macroChipDot, { backgroundColor: color }]} />
                  <ThemedText style={styles.macroChipLabel} lightColor={MetaFitColors.text.secondary}>{label}</ThemedText>
                  <ThemedText style={styles.macroChipValue} lightColor={MetaFitColors.text.primary}>
                    {Math.round(parseFloat(value || "0") * porciones * 10) / 10}g
                  </ThemedText>
                </View>
              ))}
            </View>

            {/* Ingredients section */}
            <View style={styles.ingredientsSection}>
              <View style={styles.ingredientsHeader}>
                <ThemedText style={styles.ingredientsTitle} lightColor={MetaFitColors.text.primary}>
                  Ingredientes
                </ThemedText>
                <TouchableOpacity onPress={() => router.back()} style={styles.editIngBtn}>
                  <ThemedText style={styles.editIngBtnText} lightColor={MetaFitColors.button.primary}>
                    + Editar
                  </ThemedText>
                </TouchableOpacity>
              </View>
              {ingredientes.map((ing, idx) => {
                const m = macroIngrediente(ing);
                return (
                  <View key={idx} style={styles.ingRow}>
                    <ThemedText style={styles.ingRowName} lightColor={MetaFitColors.text.primary} numberOfLines={1}>
                      {ing.nombre}
                    </ThemedText>
                    <ThemedText style={styles.ingRowSep} lightColor={MetaFitColors.text.tertiary}> · </ThemedText>
                    <ThemedText style={styles.ingRowCal} lightColor={MetaFitColors.text.secondary}>
                      {Math.round(m.energia * porciones)} cal
                    </ThemedText>
                    <View style={styles.ingRowSpacer} />
                    <ThemedText style={styles.ingRowQty} lightColor={MetaFitColors.text.tertiary}>
                      {ing.peso}g
                    </ThemedText>
                  </View>
                );
              })}
            </View>

            {/* Foto opcional — solo si no hay foto del escaneo ya adjunta */}
            {localFotoUri && (
              <View style={styles.fotoSection}>
                <View style={styles.fotoPreviewRow}>
                  <Image source={{ uri: localFotoUri }} style={styles.fotoPreview} resizeMode="cover" />
                  <View style={styles.fotoPreviewInfo}>
                    <ThemedText style={styles.fotoPreviewLabel} lightColor={MetaFitColors.text.secondary}>
                      Foto adjunta
                    </ThemedText>
                    <TouchableOpacity onPress={() => setLocalFotoUri(null)} activeOpacity={0.7}>
                      <ThemedText style={styles.fotoQuitarText} lightColor={MetaFitColors.calificacion.baja}>
                        Quitar foto
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity onPress={handleAgregarFoto} style={styles.fotoCambiarBtn} activeOpacity={0.7}>
                    <IconSymbol name="pencil" size={14} color={MetaFitColors.button.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        ) : (
          <>
            {/* ── Standard mode: search + full card ── */}
            <BuscarComidasAnteriores
              comidasSeleccionadas={comidasSeleccionadas}
              onComidasSeleccionadasChange={(ids) => {
                setComidasSeleccionadas(ids);
                if (ids.length === 0) {
                  setComidaSeleccionadaId(null);
                } else {
                  setComidaSeleccionadaId(ids[ids.length - 1]);
                }
              }}
              onComidaSeleccionada={handleComidaSeleccionada}
              onDropdownToggle={setIsDropdownOpen}
            />

            {!isDropdownOpen && comidasSeleccionadas.length === 0 && (
              <>
                <DetallesComidaCard
                  datos={datosComida}
                  onDatosChange={setDatosComida}
                  onCalcularConIA={handleCalcularConIA}
                />

                {/* Separador "o" */}
                <View style={styles.separadorRow}>
                  <View style={styles.separadorLinea} />
                  <ThemedText style={styles.separadorTexto} lightColor={MetaFitColors.text.tertiary}>o</ThemedText>
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
                        tipoComida: tipoComidaSeleccionado || "",
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

                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => setGuardarComida(!guardarComida)}
                  activeOpacity={0.7}
                >
                  <View style={styles.checkbox}>
                    {guardarComida && (
                      <View style={styles.checkboxChecked}>
                        <IconSymbol name="checkmark" size={16} color={MetaFitColors.text.white} />
                      </View>
                    )}
                  </View>
                  <ThemedText style={styles.checkboxLabel} lightColor={MetaFitColors.text.primary}>
                    Guardar comida
                  </ThemedText>
                </TouchableOpacity>
              </>
            )}
          </>
        )}

        {/* Foto opcional (solo modo estándar, sin foto de escaneo previa, sin comida guardada seleccionada ni dropdown abierto) */}
        {(!ingredientes || ingredientes.length === 0) && comidasSeleccionadas.length === 0 && !isDropdownOpen && (
          <View style={styles.fotoSection}>
            {localFotoUri ? (
              <View style={styles.fotoPreviewRow}>
                <Image source={{ uri: localFotoUri }} style={styles.fotoPreview} resizeMode="cover" />
                <View style={styles.fotoPreviewInfo}>
                  <ThemedText style={styles.fotoPreviewLabel} lightColor={MetaFitColors.text.secondary}>
                    Foto adjunta
                  </ThemedText>
                  <TouchableOpacity onPress={() => setLocalFotoUri(null)} activeOpacity={0.7}>
                    <ThemedText style={styles.fotoQuitarText} lightColor={MetaFitColors.calificacion.baja}>
                      Quitar foto
                    </ThemedText>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={handleAgregarFoto} style={styles.fotoCambiarBtn} activeOpacity={0.7}>
                  <IconSymbol name="pencil" size={14} color={MetaFitColors.button.primary} />
                </TouchableOpacity>
              </View>
            ) : !imagenUri ? (
              <TouchableOpacity style={styles.fotoAgregarBtn} onPress={handleAgregarFoto} activeOpacity={0.75}>
                <IconSymbol name="camera" size={16} color={MetaFitColors.text.secondary} />
                <ThemedText style={styles.fotoAgregarText} lightColor={MetaFitColors.text.secondary}>
                  Agregar foto (opcional)
                </ThemedText>
              </TouchableOpacity>
            ) : null}
          </View>
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
    color: MetaFitColors.text.secondary,
  },
  tipoComidaTextActive: {
    color: MetaFitColors.button.primary,
  },
  agregarButton: {
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
  agregarButtonDisabled: {
    opacity: 0.5,
  },
  agregarButtonText: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.2,
    color: MetaFitColors.text.white,
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
    backgroundColor: MetaFitColors.background.card,
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
    fontSize: 15,
    fontWeight: "500",
  },

  // ── Ingredient breakdown mode ──
  heroImage: {
    width: "100%",
    height: 200,
    borderRadius: 18,
    marginBottom: 16,
    overflow: "hidden",
  },
  titleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: MetaFitColors.background.card,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
    gap: 12,
  },
  tituloInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: MetaFitColors.text.primary,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: MetaFitColors.background.elevated,
    borderRadius: 20,
    paddingHorizontal: 4,
    paddingVertical: 4,
    gap: 2,
  },
  stepperBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: MetaFitColors.background.card,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperBtnText: {
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 22,
  },
  stepperValue: {
    fontSize: 15,
    fontWeight: "700",
    minWidth: 28,
    textAlign: "center",
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

  // Foto opcional
  fotoSection: {
    marginBottom: 16,
  },
  fotoAgregarBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
    borderStyle: "dashed",
    backgroundColor: MetaFitColors.background.card,
  },
  fotoAgregarText: {
    fontSize: 14,
    fontWeight: "500",
  },
  fotoPreviewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: MetaFitColors.background.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
    padding: 10,
  },
  fotoPreview: {
    width: 56,
    height: 56,
    borderRadius: 8,
  },
  fotoPreviewInfo: {
    flex: 1,
    gap: 4,
  },
  fotoPreviewLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  fotoQuitarText: {
    fontSize: 12,
    fontWeight: "500",
  },
  fotoCambiarBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: MetaFitColors.background.elevated,
    alignItems: "center",
    justifyContent: "center",
  },
  fechaButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    backgroundColor: MetaFitColors.background.card,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
    marginBottom: 20,
  },
  fechaButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: MetaFitColors.border.light,
  },
  iosPickerTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  iosPickerBtn: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  iosPickerCancelText: {
    fontSize: 15,
    fontWeight: "500",
  },
  iosPickerAceptarText: {
    fontSize: 15,
    fontWeight: "700",
  },
  iosPicker: {
    height: 200,
  },
});

