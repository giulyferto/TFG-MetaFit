import { IconSymbol } from "@/components/ui/icon-symbol";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { MetaFitColors } from "@/constants/theme";
import {
  calcularMacros,
  calcularTotales,
  ingredienteDesdeIA,
  type Ingrediente,
} from "@/utils/ingredientes";
import { BarcodeScannerOverlay } from "@/components/BarcodeScannerOverlay";
import { asegurarBase64Jpeg, asegurarBase64JpegBarras, seleccionarImagen } from "@/utils/image";
import * as ImagePicker from "expo-image-picker";
import { buscarProductoPorEAN } from "@/utils/open-food-facts";
import { leerEANDeImagen, leerEtiquetaNutricional, obtenerNutricionIngrediente } from "@/utils/openai";
import { router, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type TipoComida = "Desayuno" | "Almuerzo" | "Cena" | "Snack" | "Otro";
const TIPOS_COMIDA: TipoComida[] = ["Desayuno", "Almuerzo", "Cena", "Snack", "Otro"];

let _idCounter = 0;
function nextId() {
  return String(++_idCounter);
}

export default function IngredientesScreen() {
  const params = useLocalSearchParams<{
    ingredientesJson: string;
    nombre: string;
    imagenUri?: string;
    desdeManual?: string;
    desdeEditar?: string;
    desdeReagregar?: string;
    registroId?: string;
    tipoComida?: string;
    fecha?: string;
  }>();

  const [ingredientes, setIngredientes] = useState<Ingrediente[]>(() => {
    try {
      const parsed: any[] = JSON.parse(params.ingredientesJson || "[]");
      return parsed.map((ia) => {
        // Soporta tanto IngredienteIA (pesoEstimado) como IngredienteGuardado (peso)
        const pesoVal = ia.peso !== undefined ? String(ia.peso) : String(ia.pesoEstimado ?? "");
        if (ia.pesoEstimado !== undefined && ia.peso === undefined) {
          return ingredienteDesdeIA(ia, nextId());
        }
        return {
          id: nextId(),
          nombre: ia.nombre,
          peso: pesoVal,
          energiaPor100g: ia.energiaPor100g,
          carbPor100g: ia.carbPor100g,
          proteinaPor100g: ia.proteinaPor100g,
          fibraPor100g: ia.fibraPor100g,
          grasaPor100g: ia.grasaPor100g,
        };
      });
    } catch {
      return [];
    }
  });

  const [nombrePlato, setNombrePlato] = useState(params.nombre || "");
  const [tipoComida, setTipoComida] = useState<TipoComida | null>(
    TIPOS_COMIDA.includes(params.tipoComida as TipoComida) ? (params.tipoComida as TipoComida) : null
  );

  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoPeso, setNuevoPeso] = useState("");
  const [isAgregando, setIsAgregando] = useState(false);
  const [isEscaneando, setIsEscaneando] = useState(false);
  const [mostrarScanner, setMostrarScanner] = useState(false);

  const [mostrarFormAgregar, setMostrarFormAgregar] = useState(params.desdeManual === "true");
  const nuevoNombreRef = useRef<TextInput>(null);

  const totales = calcularTotales(ingredientes);

  const handlePesoChange = (id: string, valor: string) => {
    // Only allow numeric input
    if (valor !== "" && !/^\d*\.?\d*$/.test(valor)) return;
    setIngredientes((prev) => prev.map((ing) => (ing.id === id ? { ...ing, peso: valor } : ing)));
  };

  const handleEliminar = (id: string) => {
    if (ingredientes.length <= 1) {
      Alert.alert("No se puede eliminar", "Debe haber al menos un ingrediente");
      return;
    }
    setIngredientes((prev) => prev.filter((ing) => ing.id !== id));
  };

  const handleAgregarIngrediente = async () => {
    if (!nuevoNombre.trim()) {
      Alert.alert("Error", "Ingresa el nombre del ingrediente");
      return;
    }
    if (!nuevoPeso.trim() || parseFloat(nuevoPeso) <= 0) {
      Alert.alert("Error", "Ingresa un peso válido en gramos");
      return;
    }

    setIsAgregando(true);
    try {
      const nutricion = await obtenerNutricionIngrediente(nuevoNombre.trim());
      const nuevo: Ingrediente = {
        id: nextId(),
        nombre: nuevoNombre.trim(),
        peso: nuevoPeso.trim(),
        energiaPor100g: nutricion.energiaPor100g,
        carbPor100g: nutricion.carbPor100g,
        proteinaPor100g: nutricion.proteinaPor100g,
        fibraPor100g: nutricion.fibraPor100g,
        grasaPor100g: nutricion.grasaPor100g,
      };
      setIngredientes((prev) => [...prev, nuevo]);
      setNuevoNombre("");
      setNuevoPeso("");
      setMostrarFormAgregar(false);
    } catch (error: any) {
      Alert.alert("Error", `No se pudo obtener los datos nutricionales: ${error.message || "intenta de nuevo"}`);
    } finally {
      setIsAgregando(false);
    }
  };

  const agregarIngredienteDesdeEAN = async (ean: string) => {
    setMostrarScanner(false);
    setIsEscaneando(true);
    try {
      const producto = await buscarProductoPorEAN(ean);
      if (!producto) {
        Alert.alert(
          "Producto no encontrado",
          `No se encontró el código ${ean} en la base de datos. Podés ingresarlo manualmente.`,
          [{ text: "OK" }]
        );
        return;
      }
      const nuevo: Ingrediente = {
        id: nextId(),
        nombre: producto.nombre,
        peso: String(producto.cantidad),
        energiaPor100g: producto.energiaPor100g,
        carbPor100g: producto.carbPor100g,
        proteinaPor100g: producto.proteinaPor100g,
        fibraPor100g: producto.fibraPor100g,
        grasaPor100g: producto.grasaPor100g,
      };
      setIngredientes((prev) => [...prev, nuevo]);
    } catch (error: any) {
      Alert.alert("Error", error.message || "No se pudo obtener el producto.");
    } finally {
      setIsEscaneando(false);
    }
  };

  const handleFallbackFoto = async () => {
    setMostrarScanner(false);

    let uri: string | null = null;
    try {
      const result = await ImagePicker.launchCameraAsync({ allowsEditing: false, quality: 1, base64: false });
      if (!result.canceled && result.assets[0]) uri = result.assets[0].uri;
    } catch {
      // Simulador sin cámara real — abrir galería como alternativa
      const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: false, quality: 1, base64: false });
      if (!result.canceled && result.assets[0]) uri = result.assets[0].uri;
    }

    if (!uri) return;

    setIsEscaneando(true);
    try {
      const imagenBase64 = await asegurarBase64JpegBarras(uri);
      const resultado = await leerEANDeImagen(imagenBase64);
      if (!resultado.encontrado || !resultado.ean) {
        Alert.alert(
          "No se pudo leer el código",
          "Los dígitos no eran legibles. Intentá tomar la foto más cerca y con buena luz.",
          [{ text: "OK" }]
        );
        setIsEscaneando(false);
        return;
      }
      await agregarIngredienteDesdeEAN(resultado.ean);
    } catch (error: any) {
      Alert.alert("Error", error.message || "No se pudo procesar la imagen.");
      setIsEscaneando(false);
    }
  };

  const handleEscanearProducto = () => {
    setMostrarFormAgregar(false);
    setMostrarScanner(true);
  };

  const handleFotoEtiqueta = async () => {
    setMostrarFormAgregar(false);

    let uri: string | null = null;
    try {
      const result = await ImagePicker.launchCameraAsync({ allowsEditing: false, quality: 1, base64: false });
      if (!result.canceled && result.assets[0]) uri = result.assets[0].uri;
    } catch {
      const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: false, quality: 1, base64: false });
      if (!result.canceled && result.assets[0]) uri = result.assets[0].uri;
    }

    if (!uri) return;

    setIsEscaneando(true);
    try {
      const imagenBase64 = await asegurarBase64Jpeg(uri);
      const resultado = await leerEtiquetaNutricional(imagenBase64);

      if (!resultado.encontrado) {
        Alert.alert(
          "No se encontró tabla nutricional",
          "Asegurate de enfocar bien la tabla de información nutricional del envase.",
          [{ text: "OK" }]
        );
        return;
      }

      const nuevo: Ingrediente = {
        id: nextId(),
        nombre: resultado.nombre || "Producto escaneado",
        peso: String(resultado.cantidad || 100),
        energiaPor100g: resultado.energiaPor100g ?? 0,
        carbPor100g: resultado.carbPor100g ?? 0,
        proteinaPor100g: resultado.proteinaPor100g ?? 0,
        fibraPor100g: resultado.fibraPor100g ?? 0,
        grasaPor100g: resultado.grasaPor100g ?? 0,
      };
      setIngredientes((prev) => [...prev, nuevo]);
    } catch (error: any) {
      Alert.alert("Error", error.message || "No se pudo procesar la imagen.");
    } finally {
      setIsEscaneando(false);
    }
  };

  const handleContinuar = () => {
    if (ingredientes.length === 0) {
      Alert.alert("Sin ingredientes", "Agrega al menos un ingrediente");
      return;
    }

    const pesoTotal = ingredientes.reduce((s, i) => s + (parseFloat(i.peso) || 0), 0);

    if (params.desdeReagregar === "true") {
      router.replace({
        pathname: "/reagregar-comida",
        params: {
          nombre: nombrePlato || "",
          cantidad: String(Math.round(pesoTotal)),
          energia: String(totales.energia),
          carb: String(totales.carb),
          proteina: String(totales.proteina),
          fibra: String(totales.fibra),
          grasa: String(totales.grasa),
          tipoComida: tipoComida || "",
          ingredientesJson: JSON.stringify(
            ingredientes.map((ing) => ({
              nombre: ing.nombre,
              peso: ing.peso,
              energiaPor100g: ing.energiaPor100g,
              carbPor100g: ing.carbPor100g,
              proteinaPor100g: ing.proteinaPor100g,
              fibraPor100g: ing.fibraPor100g,
              grasaPor100g: ing.grasaPor100g,
            }))
          ),
        },
      });
      return;
    }

    if (params.desdeEditar === "true") {
      router.replace({
        pathname: "/editar-registro",
        params: {
          registroId: params.registroId || "",
          nombre: nombrePlato || "",
          cantidad: String(Math.round(pesoTotal)),
          energia: String(totales.energia),
          carb: String(totales.carb),
          proteina: String(totales.proteina),
          fibra: String(totales.fibra),
          grasa: String(totales.grasa),
          tipoComida: tipoComida || "",
          ingredientesJson: JSON.stringify(
            ingredientes.map((ing) => ({
              nombre: ing.nombre,
              peso: ing.peso,
              energiaPor100g: ing.energiaPor100g,
              carbPor100g: ing.carbPor100g,
              proteinaPor100g: ing.proteinaPor100g,
              fibraPor100g: ing.fibraPor100g,
              grasaPor100g: ing.grasaPor100g,
            }))
          ),
        },
      });
      return;
    }

    const destino = {
      pathname: "/registro-manual" as const,
      params: {
        nombre: nombrePlato || "",
        cantidad: String(Math.round(pesoTotal)),
        energia: String(totales.energia),
        carb: String(totales.carb),
        proteina: String(totales.proteina),
        fibra: String(totales.fibra),
        grasa: String(totales.grasa),
        desdeIA: "true",
        imagenUri: params.imagenUri || "",
        tipoComida: tipoComida || "",
        ...(params.fecha ? { fecha: params.fecha } : {}),
        ingredientesJson: JSON.stringify(
          ingredientes.map((ing) => ({
            nombre: ing.nombre,
            peso: ing.peso,
            energiaPor100g: ing.energiaPor100g,
            carbPor100g: ing.carbPor100g,
            proteinaPor100g: ing.proteinaPor100g,
            fibraPor100g: ing.fibraPor100g,
            grasaPor100g: ing.grasaPor100g,
          }))
        ),
      },
    };

    // Cuando viene del registro manual, reemplazar la pantalla para no apilar dos veces
    if (params.desdeManual === "true") {
      router.replace(destino);
    } else {
      router.push(destino);
    }
  };

  return (
    <ThemedView style={styles.container} lightColor={MetaFitColors.background.white}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={20} color={MetaFitColors.text.secondary} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <ThemedText style={styles.headerTitle} lightColor={MetaFitColors.text.primary}>
            Desglose de ingredientes
          </ThemedText>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Nombre del plato */}
          <View style={styles.metaCard}>
            <TextInput
              style={styles.nombreInput}
              value={nombrePlato}
              onChangeText={setNombrePlato}
              placeholder="Nombre del plato..."
              placeholderTextColor={MetaFitColors.text.tertiary}
              autoCapitalize="sentences"
              returnKeyType="done"
            />
          </View>

          {/* Tipo de comida */}
          <View style={styles.tipoComidaContainer}>
            {TIPOS_COMIDA.map((tipo) => (
              <TouchableOpacity
                key={tipo}
                style={[styles.tipoButton, tipoComida === tipo && styles.tipoButtonActive]}
                onPress={() => setTipoComida(tipo)}
                activeOpacity={0.75}
              >
                <ThemedText
                  style={[styles.tipoText, tipoComida === tipo && styles.tipoTextActive]}
                  lightColor={tipoComida === tipo ? MetaFitColors.button.primary : MetaFitColors.text.secondary}
                >
                  {tipo}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>

          {/* Totals card */}
          <View style={styles.totalesCard}>
            <ThemedText style={styles.totalesLabel} lightColor={MetaFitColors.text.secondary}>
              Total del plato
            </ThemedText>
            <View style={styles.totalesRow}>
              <View style={styles.totalItem}>
                <ThemedText style={styles.totalValue} lightColor={MetaFitColors.button.primary}>
                  {totales.energia}
                </ThemedText>
                <ThemedText style={styles.totalLabel} lightColor={MetaFitColors.text.secondary}>kcal</ThemedText>
              </View>
              <View style={styles.totalDivider} />
              <View style={styles.totalItem}>
                <ThemedText style={styles.totalValue} lightColor={MetaFitColors.text.primary}>
                  {totales.carb}g
                </ThemedText>
                <ThemedText style={styles.totalLabel} lightColor={MetaFitColors.text.secondary}>Carbos</ThemedText>
              </View>
              <View style={styles.totalDivider} />
              <View style={styles.totalItem}>
                <ThemedText style={styles.totalValue} lightColor={MetaFitColors.text.primary}>
                  {totales.proteina}g
                </ThemedText>
                <ThemedText style={styles.totalLabel} lightColor={MetaFitColors.text.secondary}>Proteína</ThemedText>
              </View>
              <View style={styles.totalDivider} />
              <View style={styles.totalItem}>
                <ThemedText style={styles.totalValue} lightColor={MetaFitColors.text.primary}>
                  {totales.grasa}g
                </ThemedText>
                <ThemedText style={styles.totalLabel} lightColor={MetaFitColors.text.secondary}>Grasa</ThemedText>
              </View>
            </View>
          </View>

          {/* Ingredient list */}
          <ThemedText style={styles.sectionLabel} lightColor={MetaFitColors.text.secondary}>
            Ingredientes ({ingredientes.length})
          </ThemedText>

          <View style={styles.ingredientesList}>
            {ingredientes.map((ing) => {
              const macros = calcularMacros(ing);
              return (
                <View key={ing.id} style={styles.ingredienteCard}>
                  {/* Name row */}
                  <View style={styles.ingredienteHeader}>
                    <ThemedText style={styles.ingredienteNombre} lightColor={MetaFitColors.text.primary} numberOfLines={1}>
                      {ing.nombre}
                    </ThemedText>
                    <TouchableOpacity
                      onPress={() => handleEliminar(ing.id)}
                      style={styles.deleteButton}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <IconSymbol name="trash" size={14} color={MetaFitColors.calificacion.baja} />
                    </TouchableOpacity>
                  </View>

                  {/* Weight input */}
                  <View style={styles.pesoRow}>
                    <ThemedText style={styles.pesoLabel} lightColor={MetaFitColors.text.secondary}>
                      Peso (g)
                    </ThemedText>
                    <View style={styles.pesoInputWrapper}>
                      <TextInput
                        style={styles.pesoInput}
                        value={ing.peso}
                        onChangeText={(v) => handlePesoChange(ing.id, v)}
                        keyboardType="decimal-pad"
                        selectTextOnFocus
                        placeholder="0"
                        placeholderTextColor={MetaFitColors.text.tertiary}
                      />
                      <ThemedText style={styles.pesoUnit} lightColor={MetaFitColors.text.tertiary}>g</ThemedText>
                    </View>
                  </View>

                  {/* Calculated macros */}
                  <View style={styles.macrosRow}>
                    <View style={styles.macroChip}>
                      <ThemedText style={styles.macroChipValue} lightColor={MetaFitColors.button.primary}>
                        {macros.energia}
                      </ThemedText>
                      <ThemedText style={styles.macroChipLabel} lightColor={MetaFitColors.text.secondary}>kcal</ThemedText>
                    </View>
                    <View style={styles.macroChip}>
                      <ThemedText style={styles.macroChipValue} lightColor={MetaFitColors.text.primary}>
                        {macros.carb}g
                      </ThemedText>
                      <ThemedText style={styles.macroChipLabel} lightColor={MetaFitColors.text.secondary}>C</ThemedText>
                    </View>
                    <View style={styles.macroChip}>
                      <ThemedText style={styles.macroChipValue} lightColor={MetaFitColors.text.primary}>
                        {macros.proteina}g
                      </ThemedText>
                      <ThemedText style={styles.macroChipLabel} lightColor={MetaFitColors.text.secondary}>P</ThemedText>
                    </View>
                    <View style={styles.macroChip}>
                      <ThemedText style={styles.macroChipValue} lightColor={MetaFitColors.text.primary}>
                        {macros.grasa}g
                      </ThemedText>
                      <ThemedText style={styles.macroChipLabel} lightColor={MetaFitColors.text.secondary}>G</ThemedText>
                    </View>
                    <View style={styles.macroChip}>
                      <ThemedText style={styles.macroChipValue} lightColor={MetaFitColors.text.primary}>
                        {macros.fibra}g
                      </ThemedText>
                      <ThemedText style={styles.macroChipLabel} lightColor={MetaFitColors.text.secondary}>F</ThemedText>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Add ingredient */}
          {isEscaneando && (
            <View style={styles.escaneandoCard}>
              <ActivityIndicator size="small" color={MetaFitColors.calificacion.media} />
              <ThemedText style={styles.escaneandoText} lightColor={MetaFitColors.text.secondary}>
                Analizando código de barras con IA...
              </ThemedText>
            </View>
          )}

          {!isEscaneando && mostrarFormAgregar ? (
            <View style={styles.addCard}>
              <ThemedText style={styles.addCardTitle} lightColor={MetaFitColors.text.primary}>
                Nuevo ingrediente
              </ThemedText>

              {/* Scan button */}
              <TouchableOpacity style={styles.scanButton} onPress={handleEscanearProducto} activeOpacity={0.75}>
                <IconSymbol name="barcode.viewfinder" size={18} color={MetaFitColors.calificacion.media} />
                <ThemedText style={styles.scanButtonText} lightColor={MetaFitColors.calificacion.media}>
                  Escanear código de barras
                </ThemedText>
              </TouchableOpacity>

              {/* Label photo button */}
              <TouchableOpacity style={styles.labelButton} onPress={handleFotoEtiqueta} activeOpacity={0.75}>
                <IconSymbol name="camera.viewfinder" size={18} color={MetaFitColors.button.primary} />
                <ThemedText style={styles.labelButtonText} lightColor={MetaFitColors.button.primary}>
                  Foto de etiqueta nutricional
                </ThemedText>
              </TouchableOpacity>

              {/* OR divider */}
              <View style={styles.orDivider}>
                <View style={styles.orDividerLine} />
                <ThemedText style={styles.orDividerText} lightColor={MetaFitColors.text.tertiary}>
                  o ingresa manualmente
                </ThemedText>
                <View style={styles.orDividerLine} />
              </View>

              <View style={styles.addFieldGroup}>
                <ThemedText style={styles.addFieldLabel} lightColor={MetaFitColors.text.secondary}>
                  Nombre
                </ThemedText>
                <TextInput
                  ref={nuevoNombreRef}
                  style={styles.addInput}
                  value={nuevoNombre}
                  onChangeText={setNuevoNombre}
                  placeholder="Ej: queso crema, jamón, tomate..."
                  placeholderTextColor={MetaFitColors.text.tertiary}
                  autoCapitalize="none"
                  returnKeyType="next"
                  onSubmitEditing={() => {/* focus peso */}}
                />
              </View>
              <View style={styles.addFieldGroup}>
                <ThemedText style={styles.addFieldLabel} lightColor={MetaFitColors.text.secondary}>
                  Peso estimado (g)
                </ThemedText>
                <View style={styles.pesoInputWrapper}>
                  <TextInput
                    style={styles.addInput}
                    value={nuevoPeso}
                    onChangeText={setNuevoPeso}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={MetaFitColors.text.tertiary}
                  />
                  <ThemedText style={styles.pesoUnit} lightColor={MetaFitColors.text.tertiary}>g</ThemedText>
                </View>
              </View>
              <View style={styles.addActions}>
                <TouchableOpacity
                  style={styles.addCancelButton}
                  onPress={() => { setMostrarFormAgregar(false); setNuevoNombre(""); setNuevoPeso(""); }}
                >
                  <ThemedText style={styles.addCancelText} lightColor={MetaFitColors.text.secondary}>
                    Cancelar
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.addConfirmButton, isAgregando && styles.buttonDisabled]}
                  onPress={handleAgregarIngrediente}
                  disabled={isAgregando}
                >
                  {isAgregando ? (
                    <ActivityIndicator size="small" color={MetaFitColors.text.white} />
                  ) : (
                    <ThemedText style={styles.addConfirmText} lightColor={MetaFitColors.text.white}>
                      Agregar
                    </ThemedText>
                  )}
                </TouchableOpacity>
              </View>
              {isAgregando && (
                <ThemedText style={styles.loadingHint} lightColor={MetaFitColors.text.tertiary}>
                  Consultando valores nutricionales con IA...
                </ThemedText>
              )}
            </View>
          ) : (
            !isEscaneando && (
              <TouchableOpacity
                style={styles.addTriggerButton}
                onPress={() => { setMostrarFormAgregar(true); setTimeout(() => nuevoNombreRef.current?.focus(), 100); }}
                activeOpacity={0.7}
              >
                <IconSymbol name="plus" size={16} color={MetaFitColors.button.primary} />
                <ThemedText style={styles.addTriggerText} lightColor={MetaFitColors.button.primary}>
                  Agregar ingrediente
                </ThemedText>
              </TouchableOpacity>
            )
          )}

        </ScrollView>

        {/* Continue button */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.continuarButton} onPress={handleContinuar} activeOpacity={0.85}>
            <ThemedText style={styles.continuarText} lightColor={MetaFitColors.text.white}>
              Continuar
            </ThemedText>
            <IconSymbol name="chevron.right" size={16} color={MetaFitColors.text.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {mostrarScanner && (
        <BarcodeScannerOverlay
          onEANDetectado={agregarIngredienteDesdeEAN}
          onFallbackFoto={handleFallbackFoto}
          onCerrar={() => setMostrarScanner(false)}
        />
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
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: MetaFitColors.background.card,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: "700", letterSpacing: -0.2 },
  headerSubtitle: { fontSize: 12, marginTop: 2 },
  keyboardView: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 120 },

  // Meta card (nombre + foto)
  metaCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: MetaFitColors.background.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    gap: 10,
  },
  nombreInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: MetaFitColors.text.primary,
    paddingVertical: 4,
  },
  // Tipo de comida
  tipoComidaContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
    flexWrap: "wrap",
  },
  tipoButton: {
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: 20,
    backgroundColor: MetaFitColors.background.card,
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
    minWidth: 72,
    alignItems: "center",
  },
  tipoButtonActive: {
    backgroundColor: MetaFitColors.background.elevated,
    borderColor: MetaFitColors.button.primary,
  },
  tipoText: {
    fontSize: 13,
    fontWeight: "600",
  },
  tipoTextActive: {
    color: MetaFitColors.button.primary,
  },

  // Totals
  totalesCard: {
    backgroundColor: MetaFitColors.background.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
    padding: 16,
    marginBottom: 24,
    gap: 10,
  },
  totalesLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase" },
  totalesRow: { flexDirection: "row", alignItems: "center" },
  totalItem: { flex: 1, alignItems: "center", gap: 2 },
  totalDivider: { width: 1, height: 28, backgroundColor: MetaFitColors.border.light },
  totalValue: { fontSize: 18, fontWeight: "800", letterSpacing: -0.4 },
  totalLabel: { fontSize: 10, fontWeight: "500" },

  // Ingredient list
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  ingredientesList: { gap: 10, marginBottom: 12 },
  ingredienteCard: {
    backgroundColor: MetaFitColors.background.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
    padding: 14,
    gap: 10,
  },
  ingredienteHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ingredienteNombre: { fontSize: 15, fontWeight: "700", flex: 1 },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "rgba(201, 72, 72, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  pesoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: MetaFitColors.background.elevated,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  pesoLabel: { fontSize: 13, fontWeight: "500" },
  pesoInputWrapper: { flexDirection: "row", alignItems: "center", gap: 4 },
  pesoInput: {
    fontSize: 16,
    fontWeight: "700",
    color: MetaFitColors.text.primary,
    textAlign: "right",
    minWidth: 56,
    padding: 0,
  },
  pesoUnit: { fontSize: 13, fontWeight: "500" },
  macrosRow: {
    flexDirection: "row",
    gap: 6,
  },
  macroChip: {
    flex: 1,
    backgroundColor: MetaFitColors.background.elevated,
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: "center",
    gap: 1,
  },
  macroChipValue: { fontSize: 12, fontWeight: "700" },
  macroChipLabel: { fontSize: 9, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.3 },

  // Scanning loading
  escaneandoCard: {
    backgroundColor: MetaFitColors.background.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  escaneandoText: { fontSize: 13, flex: 1 },

  // Scan button inside form
  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: `${MetaFitColors.calificacion.media}12`,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${MetaFitColors.calificacion.media}40`,
    paddingVertical: 12,
  },
  scanButtonText: { fontSize: 14, fontWeight: "600" as const },

  labelButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: `${MetaFitColors.button.primary}12`,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${MetaFitColors.button.primary}40`,
    paddingVertical: 12,
  },
  labelButtonText: { fontSize: 14, fontWeight: "600" as const },

  // OR divider
  orDivider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  orDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: MetaFitColors.border.light,
  },
  orDividerText: { fontSize: 11, fontWeight: "500" as const },

  // Add ingredient
  addTriggerButton: {
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
    marginBottom: 8,
  },
  addTriggerText: { fontSize: 14, fontWeight: "700" },
  addCard: {
    backgroundColor: MetaFitColors.background.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: MetaFitColors.border.accent,
    padding: 16,
    gap: 12,
    marginBottom: 8,
  },
  addCardTitle: { fontSize: 15, fontWeight: "700" },
  addFieldGroup: { gap: 6 },
  addFieldLabel: { fontSize: 12, fontWeight: "600" },
  addInput: {
    flex: 1,
    fontSize: 15,
    color: MetaFitColors.text.primary,
    backgroundColor: MetaFitColors.background.elevated,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  addActions: { flexDirection: "row", gap: 10 },
  addCancelButton: {
    flex: 1,
    backgroundColor: MetaFitColors.background.elevated,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  addCancelText: { fontSize: 14, fontWeight: "600" },
  addConfirmButton: {
    flex: 1,
    backgroundColor: MetaFitColors.button.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  addConfirmText: { fontSize: 14, fontWeight: "700" },
  buttonDisabled: { opacity: 0.5 },
  loadingHint: { fontSize: 12, textAlign: "center" },

  // Footer
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 12,
    backgroundColor: MetaFitColors.background.white,
    borderTopWidth: 1,
    borderTopColor: MetaFitColors.border.light,
  },
  continuarButton: {
    backgroundColor: MetaFitColors.button.primary,
    borderRadius: 16,
    paddingVertical: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#2C3E50",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  continuarText: { fontSize: 16, fontWeight: "700" },
});
