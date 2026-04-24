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
import { obtenerNutricionIngrediente } from "@/utils/openai";
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

let _idCounter = 0;
function nextId() {
  return String(++_idCounter);
}

export default function IngredientesScreen() {
  const params = useLocalSearchParams<{
    ingredientesJson: string;
    nombre: string;
    imagenUri?: string;
  }>();

  const [ingredientes, setIngredientes] = useState<Ingrediente[]>(() => {
    try {
      const parsed: any[] = JSON.parse(params.ingredientesJson || "[]");
      return parsed.map((ia) => ingredienteDesdeIA(ia, nextId()));
    } catch {
      return [];
    }
  });

  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoPeso, setNuevoPeso] = useState("");
  const [isAgregando, setIsAgregando] = useState(false);
  const [mostrarFormAgregar, setMostrarFormAgregar] = useState(false);
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

  const handleContinuar = () => {
    if (ingredientes.length === 0) {
      Alert.alert("Sin ingredientes", "Agrega al menos un ingrediente");
      return;
    }

    const pesoTotal = ingredientes.reduce((s, i) => s + (parseFloat(i.peso) || 0), 0);

    router.push({
      pathname: "/registro-manual",
      params: {
        nombre: params.nombre || "",
        cantidad: String(Math.round(pesoTotal)),
        energia: String(totales.energia),
        carb: String(totales.carb),
        proteina: String(totales.proteina),
        fibra: String(totales.fibra),
        grasa: String(totales.grasa),
        desdeIA: "true",
        imagenUri: params.imagenUri || "",
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
  };

  return (
    <ThemedView style={styles.container} lightColor={MetaFitColors.background.white}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={20} color={MetaFitColors.text.secondary} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <ThemedText style={styles.headerTitle} lightColor={MetaFitColors.text.primary} numberOfLines={1}>
            {params.nombre || "Desglose de ingredientes"}
          </ThemedText>
          <ThemedText style={styles.headerSubtitle} lightColor={MetaFitColors.text.secondary}>
            Edita el peso de cada ingrediente
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
          {mostrarFormAgregar ? (
            <View style={styles.addCard}>
              <ThemedText style={styles.addCardTitle} lightColor={MetaFitColors.text.primary}>
                Nuevo ingrediente
              </ThemedText>
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
