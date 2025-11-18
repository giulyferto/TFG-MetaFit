import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { MetaFitColors } from "@/constants/theme";
import { obtenerUltimosConsumos, type Consumo } from "@/utils/consumos";
import { Image } from "expo-image";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

type HomeScreenProps = {
  onCargarComidaPress?: () => void;
};

export function HomeScreen({ onCargarComidaPress }: HomeScreenProps) {
  const [todosLosConsumos, setTodosLosConsumos] = useState<Consumo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 5;

  const cargarConsumos = useCallback(async () => {
    try {
      setIsLoading(true);
      // Obtener todos los consumos (sin límite)
      const consumos = await obtenerUltimosConsumos(1000);
      setTodosLosConsumos(consumos);
      // Resetear a la primera página cuando se cargan nuevos datos
      setCurrentPage(1);
    } catch (error) {
      console.error("Error al cargar consumos:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Calcular los consumos para la página actual
  const totalPages = Math.ceil(todosLosConsumos.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const consumosPaginaActual = todosLosConsumos.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Cargar consumos cuando el componente se monta
  useEffect(() => {
    cargarConsumos();
  }, [cargarConsumos]);

  // Recargar consumos cuando la pantalla recibe foco (cuando el usuario vuelve a esta pantalla)
  useFocusEffect(
    useCallback(() => {
      cargarConsumos();
    }, [cargarConsumos])
  );

  const handleCargarComidaPress = () => {
    if (onCargarComidaPress) {
      onCargarComidaPress();
    } else {
      // Navegar a la pantalla de registro de comida
      router.push("/registro-comida");
    }
  };

  const getCalificacionColor = (calificacion: Consumo["calificacion"]) => {
    switch (calificacion) {
      case "Alta":
        return MetaFitColors.calificacion.alta;
      case "Media":
        return MetaFitColors.calificacion.media;
      case "Baja":
        return MetaFitColors.calificacion.baja;
      default:
        return MetaFitColors.text.tertiary;
    }
  };

  const getCalificacionTexto = (calificacion: Consumo["calificacion"]) => {
    if (!calificacion) return "Sin calificar";
    return calificacion;
  };

  return (
    <ThemedView style={styles.container} lightColor={MetaFitColors.background.white}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo y nombre */}
        <View style={styles.logoContainer}>
          <Image
            source={require("@/assets/images/MetaFitLogo.png")}
            style={styles.logo}
            contentFit="contain"
          />
        </View>

        {/* Botón Cargar comida */}
        <TouchableOpacity style={styles.cargarComidaButton} onPress={handleCargarComidaPress}>
          <ThemedText style={styles.cargarComidaButtonText} lightColor={MetaFitColors.text.white}>
            Cargar comida
          </ThemedText>
        </TouchableOpacity>

        {/* Sección Últimos consumos */}
        <View style={styles.consumosSection}>
          <ThemedText style={styles.sectionTitle} lightColor={MetaFitColors.text.primary}>
            Últimos consumos registrados
          </ThemedText>

          {/* Tabla de consumos */}
          <View style={styles.tableContainer}>
            {/* Header de la tabla */}
            <View style={styles.tableHeader}>
              <ThemedText style={styles.headerText} lightColor={MetaFitColors.text.secondary}>
                Calificación
              </ThemedText>
              <ThemedText style={styles.headerText} lightColor={MetaFitColors.text.secondary}>
                Descripción
              </ThemedText>
            </View>

            {/* Filas de datos */}
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={MetaFitColors.button.primary} />
                <ThemedText
                  style={styles.loadingText}
                  lightColor={MetaFitColors.text.secondary}
                >
                  Cargando consumos...
                </ThemedText>
              </View>
            ) : todosLosConsumos.length === 0 ? (
              <View style={styles.emptyContainer}>
                <ThemedText
                  style={styles.emptyText}
                  lightColor={MetaFitColors.text.secondary}
                >
                  No hay consumos registrados aún
                </ThemedText>
              </View>
            ) : (
              consumosPaginaActual.map((consumo, index) => (
                <View key={consumo.id}>
                  <View style={styles.tableRow}>
                    <ThemedText
                      style={styles.calificacionText}
                      lightColor={getCalificacionColor(consumo.calificacion)}
                    >
                      {getCalificacionTexto(consumo.calificacion)}
                    </ThemedText>
                    <ThemedText
                      style={styles.descripcionText}
                      lightColor={MetaFitColors.text.primary}
                    >
                      {consumo.descripcion}
                    </ThemedText>
                  </View>
                  {index < consumosPaginaActual.length - 1 && <View style={styles.divider} />}
                </View>
              ))
            )}
          </View>

          {/* Controles de paginación */}
          {!isLoading && todosLosConsumos.length > itemsPerPage && (
            <View style={styles.paginationContainer}>
              <TouchableOpacity
                style={[
                  styles.paginationButton,
                  currentPage === 1 && styles.paginationButtonDisabled,
                ]}
                onPress={handlePreviousPage}
                disabled={currentPage === 1}
              >
                <ThemedText
                  style={[
                    styles.paginationButtonText,
                    currentPage === 1 && styles.paginationButtonTextDisabled,
                  ]}
                  lightColor={
                    currentPage === 1
                      ? MetaFitColors.text.tertiary
                      : MetaFitColors.text.primary
                  }
                >
                  Anterior
                </ThemedText>
              </TouchableOpacity>

              <View style={styles.paginationInfo}>
                <ThemedText
                  style={styles.paginationText}
                  lightColor={MetaFitColors.text.secondary}
                >
                  Página {currentPage} de {totalPages}
                </ThemedText>
              </View>

              <TouchableOpacity
                style={[
                  styles.paginationButton,
                  currentPage === totalPages && styles.paginationButtonDisabled,
                ]}
                onPress={handleNextPage}
                disabled={currentPage === totalPages}
              >
                <ThemedText
                  style={[
                    styles.paginationButtonText,
                    currentPage === totalPages && styles.paginationButtonTextDisabled,
                  ]}
                  lightColor={
                    currentPage === totalPages
                      ? MetaFitColors.text.tertiary
                      : MetaFitColors.text.primary
                  }
                >
                  Siguiente
                </ThemedText>
              </TouchableOpacity>
            </View>
          )}
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
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 80,
    marginBottom: 30,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  cargarComidaButton: {
    backgroundColor: MetaFitColors.button.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 30,
  },
  cargarComidaButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: MetaFitColors.text.white,
  },
  consumosSection: {
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  tableContainer: {
    backgroundColor: MetaFitColors.background.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: MetaFitColors.border.divider,
    borderBottomWidth: 1,
    borderBottomColor: MetaFitColors.border.light,
  },
  headerText: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  calificacionText: {
    fontSize: 14,
    fontWeight: "600",
    width: 100,
  },
  descripcionText: {
    fontSize: 14,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: MetaFitColors.border.divider,
    marginLeft: 16,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingHorizontal: 8,
  },
  paginationButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: MetaFitColors.button.secondary,
    minWidth: 80,
    alignItems: "center",
  },
  paginationButtonDisabled: {
    backgroundColor: MetaFitColors.border.divider,
    opacity: 0.5,
  },
  paginationButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  paginationButtonTextDisabled: {
    color: MetaFitColors.text.tertiary,
  },
  paginationInfo: {
    flex: 1,
    alignItems: "center",
  },
  paginationText: {
    fontSize: 14,
    fontWeight: "500",
  },
});

