import { IconSymbol } from "@/components/ui/icon-symbol";
import { ThemedText } from "@/components/ui/themed-text";
import { MetaFitColors } from "@/constants/theme";
import { esNumeroValido } from "@/features/shared/utils/validation";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";

export type DatosComida = {
  nombre: string;
  cantidad: string;
  energia: string;
  carb: string;
  proteina: string;
  fibra: string;
  grasa: string;
};

type DetallesComidaCardProps = {
  datos: DatosComida;
  onDatosChange: (datos: DatosComida) => void;
  onEliminar?: () => void;
  onCalcularConIA?: () => Promise<void>;
};

export function DetallesComidaCard({
  datos,
  onDatosChange,
  onEliminar,
  onCalcularConIA,
}: DetallesComidaCardProps) {
  const [isCalculando, setIsCalculando] = useState(false);

  const handleCalcularConIA = async () => {
    if (!onCalcularConIA) return;
    setIsCalculando(true);
    try {
      await onCalcularConIA();
    } finally {
      setIsCalculando(false);
    }
  };

  const actualizarCampo = (campo: keyof DatosComida, valor: string) => {
    onDatosChange({ ...datos, [campo]: valor });
  };

  const actualizarCampoNumerico = (campo: keyof DatosComida, valor: string) => {
    if (esNumeroValido(valor)) {
      onDatosChange({ ...datos, [campo]: valor });
    }
  };

  return (
    <View style={styles.comidaCard}>
      {/* Header de la tarjeta con nombre y botón eliminar */}
      <View style={styles.comidaCardHeader}>
        {onEliminar && (
          <TouchableOpacity onPress={onEliminar} style={styles.eliminarButton}>
            <View style={styles.eliminarIcon}>
              <ThemedText
                style={styles.eliminarIconText}
                lightColor={MetaFitColors.text.secondary}
              >
                −
              </ThemedText>
            </View>
          </TouchableOpacity>
        )}
        <TextInput
          style={styles.comidaNombreInput}
          placeholder="Nombre de la comida"
          placeholderTextColor={MetaFitColors.text.tertiary}
          value={datos.nombre}
          onChangeText={(valor) => actualizarCampo("nombre", valor)}
        />
      </View>

      {/* Botón calcular con IA */}
      {onCalcularConIA && (
        <TouchableOpacity
          style={[
            styles.iaButton,
            (!datos.nombre.trim() || isCalculando) && styles.iaButtonDisabled,
          ]}
          onPress={handleCalcularConIA}
          disabled={!datos.nombre.trim() || isCalculando}
          activeOpacity={0.75}
        >
          {isCalculando ? (
            <ActivityIndicator size="small" color={MetaFitColors.button.primary} />
          ) : (
            <IconSymbol name="sparkles" size={14} color={MetaFitColors.button.primary} />
          )}
          <ThemedText style={styles.iaButtonText} lightColor={MetaFitColors.button.primary}>
            {isCalculando ? "Calculando..." : "Calcular con IA"}
          </ThemedText>
        </TouchableOpacity>
      )}

      {/* Tabla nutricional */}
      <View style={styles.tablaNutricional}>
        <View style={styles.tablaRow}>
          <ThemedText style={styles.tablaLabel} lightColor={MetaFitColors.text.secondary}>
            Cantidad
          </ThemedText>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.tablaInput}
              placeholder="0"
              placeholderTextColor={MetaFitColors.text.tertiary}
              value={datos.cantidad}
              onChangeText={(valor) => actualizarCampoNumerico("cantidad", valor)}
              keyboardType="decimal-pad"
            />
            <ThemedText style={styles.unidad} lightColor={MetaFitColors.text.secondary}>
              Gr
            </ThemedText>
          </View>
        </View>
        <View style={styles.tablaDivider} />
        <View style={styles.tablaRow}>
          <ThemedText style={styles.tablaLabel} lightColor={MetaFitColors.text.secondary}>
            Energía
          </ThemedText>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.tablaInput}
              placeholder="0"
              placeholderTextColor={MetaFitColors.text.tertiary}
              value={datos.energia}
              onChangeText={(valor) => actualizarCampoNumerico("energia", valor)}
              keyboardType="decimal-pad"
            />
            <ThemedText style={styles.unidad} lightColor={MetaFitColors.text.secondary}>
              Kcal
            </ThemedText>
          </View>
        </View>
        <View style={styles.tablaDivider} />
        <View style={styles.tablaRow}>
          <ThemedText style={styles.tablaLabel} lightColor={MetaFitColors.text.secondary}>
            Carb
          </ThemedText>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.tablaInput}
              placeholder="0"
              placeholderTextColor={MetaFitColors.text.tertiary}
              value={datos.carb}
              onChangeText={(valor) => actualizarCampoNumerico("carb", valor)}
              keyboardType="decimal-pad"
            />
            <ThemedText style={styles.unidad} lightColor={MetaFitColors.text.secondary}>
              gr
            </ThemedText>
          </View>
        </View>
        <View style={styles.tablaDivider} />
        <View style={styles.tablaRow}>
          <ThemedText style={styles.tablaLabel} lightColor={MetaFitColors.text.secondary}>
            Proteina
          </ThemedText>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.tablaInput}
              placeholder="0"
              placeholderTextColor={MetaFitColors.text.tertiary}
              value={datos.proteina}
              onChangeText={(valor) => actualizarCampoNumerico("proteina", valor)}
              keyboardType="decimal-pad"
            />
            <ThemedText style={styles.unidad} lightColor={MetaFitColors.text.secondary}>
              gr
            </ThemedText>
          </View>
        </View>
        <View style={styles.tablaDivider} />
        <View style={styles.tablaRow}>
          <ThemedText style={styles.tablaLabel} lightColor={MetaFitColors.text.secondary}>
            Fibra
          </ThemedText>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.tablaInput}
              placeholder="0"
              placeholderTextColor={MetaFitColors.text.tertiary}
              value={datos.fibra}
              onChangeText={(valor) => actualizarCampoNumerico("fibra", valor)}
              keyboardType="decimal-pad"
            />
            <ThemedText style={styles.unidad} lightColor={MetaFitColors.text.secondary}>
              gr
            </ThemedText>
          </View>
        </View>
        <View style={styles.tablaDivider} />
        <View style={styles.tablaRow}>
          <ThemedText style={styles.tablaLabel} lightColor={MetaFitColors.text.secondary}>
            Grasa
          </ThemedText>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.tablaInput}
              placeholder="0"
              placeholderTextColor={MetaFitColors.text.tertiary}
              value={datos.grasa}
              onChangeText={(valor) => actualizarCampoNumerico("grasa", valor)}
              keyboardType="decimal-pad"
            />
            <ThemedText style={styles.unidad} lightColor={MetaFitColors.text.secondary}>
              gr
            </ThemedText>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  comidaCard: {
    backgroundColor: MetaFitColors.background.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
    padding: 16,
    marginBottom: 24,
  },
  comidaCardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  eliminarButton: {
    marginRight: 12,
  },
  eliminarIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: MetaFitColors.background.elevated,
  },
  eliminarIconText: {
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 20,
  },
  comidaNombreInput: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    color: MetaFitColors.text.primary,
    paddingVertical: 4,
  },
  iaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 10,
    marginBottom: 4,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: MetaFitColors.background.elevated,
    borderWidth: 1,
    borderColor: MetaFitColors.border.accent,
    alignSelf: "flex-start",
  },
  iaButtonDisabled: {
    opacity: 0.4,
  },
  iaButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  tablaNutricional: {
    marginTop: 8,
  },
  tablaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 5,
  },
  tablaLabel: {
    fontSize: 14,
    fontWeight: "400",
    flex: 1,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    justifyContent: "flex-end",
  },
  tablaInput: {
    fontSize: 14,
    fontWeight: "500",
    color: MetaFitColors.text.primary,
    textAlign: "right",
    minWidth: 60,
  },
  unidad: {
    fontSize: 14,
    fontWeight: "400",
    minWidth: 35,
  },
  tablaDivider: {
    height: 1,
    backgroundColor: MetaFitColors.border.divider,
  },
});

