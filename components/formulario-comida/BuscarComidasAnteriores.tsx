import { IconSymbol } from "@/components/ui/icon-symbol";
import { ThemedText } from "@/components/ui/themed-text";
import { MetaFitColors } from "@/constants/theme";
import { obtenerComidasAnteriores, type ComidaAnterior } from "@/utils/comidas";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

type BuscarComidasAnterioresProps = {
  comidasSeleccionadas: string[];
  onComidasSeleccionadasChange: (ids: string[]) => void;
  onComidaSeleccionada?: (comida: ComidaAnterior) => void;
  onDropdownToggle?: (isOpen: boolean) => void;
};

export function BuscarComidasAnteriores({
  comidasSeleccionadas,
  onComidasSeleccionadasChange,
  onComidaSeleccionada,
  onDropdownToggle,
}: BuscarComidasAnterioresProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [comidas, setComidas] = useState<ComidaAnterior[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && comidas.length === 0) {
      cargarComidas();
    }
  }, [isOpen]);

  const cargarComidas = async () => {
    setLoading(true);
    try {
      const comidasObtenidas = await obtenerComidasAnteriores();
      setComidas(comidasObtenidas);
    } catch (error) {
      console.error("Error al cargar comidas:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleComida = (id: string) => {
    const nuevaSeleccion = comidasSeleccionadas.includes(id)
      ? comidasSeleccionadas.filter((comidaId) => comidaId !== id)
      : [...comidasSeleccionadas, id];
    
    onComidasSeleccionadasChange(nuevaSeleccion);
    
    // Notificar cuando se selecciona una comida
    if (!comidasSeleccionadas.includes(id) && onComidaSeleccionada) {
      const comida = comidas.find((c) => c.id === id);
      if (comida) {
        onComidaSeleccionada(comida);
      }
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          const newIsOpen = !isOpen;
          setIsOpen(newIsOpen);
          if (onDropdownToggle) {
            onDropdownToggle(newIsOpen);
          }
        }}
        activeOpacity={0.7}
      >
        <ThemedText style={styles.buttonText} lightColor={MetaFitColors.text.primary}>
          Buscar comidas anteriores
        </ThemedText>
        <IconSymbol
          name={isOpen ? "chevron.up" : "chevron.down"}
          size={20}
          color={MetaFitColors.text.secondary}
        />
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.dropdown}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={MetaFitColors.button.primary} />
            </View>
          ) : comidas.length === 0 ? (
            <View style={styles.emptyContainer}>
              <ThemedText
                style={styles.emptyText}
                lightColor={MetaFitColors.text.secondary}
              >
                No hay comidas anteriores
              </ThemedText>
            </View>
          ) : (
            <ScrollView
              style={styles.listContainer}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
            >
              {comidas.map((item) => {
                const isSelected = comidasSeleccionadas.includes(item.id);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.comidaItem,
                      isSelected && styles.comidaItemSelected,
                    ]}
                    onPress={() => toggleComida(item.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.checkbox}>
                      {isSelected && (
                        <View style={styles.checkboxChecked}>
                          <IconSymbol
                            name="checkmark"
                            size={16}
                            color={MetaFitColors.text.white}
                          />
                        </View>
                      )}
                    </View>
                    <View style={styles.comidaInfo}>
                      <ThemedText
                        style={styles.comidaNombre}
                        lightColor={MetaFitColors.text.primary}
                      >
                        {item.nombre || "Sin nombre"}
                      </ThemedText>
                      {item.tipoComida && (
                        <ThemedText
                          style={styles.comidaTipo}
                          lightColor={MetaFitColors.text.secondary}
                        >
                          {item.tipoComida}
                        </ThemedText>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: MetaFitColors.button.secondary,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  dropdown: {
    marginTop: 8,
    backgroundColor: MetaFitColors.background.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
    maxHeight: 300,
    overflow: "hidden",
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  emptyContainer: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
  },
  listContainer: {
    maxHeight: 300,
  },
  listContent: {
    padding: 8,
  },
  comidaItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  comidaItemSelected: {
    backgroundColor: MetaFitColors.border.divider,
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
  comidaInfo: {
    flex: 1,
  },
  comidaNombre: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  comidaTipo: {
    fontSize: 14,
  },
});

