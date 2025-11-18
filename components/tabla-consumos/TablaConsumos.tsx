import { ThemedText } from "@/components/ui/themed-text";
import { MetaFitColors } from "@/constants/theme";
import type { Consumo } from "@/utils/consumos";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from "react-native";

type TablaConsumosProps = {
  consumos: Consumo[];
  isLoading: boolean;
  itemsPerPage?: number;
};

export function TablaConsumos({
  consumos,
  isLoading,
  itemsPerPage = 5,
}: TablaConsumosProps) {
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Resetear a la primera página cuando cambian los consumos
  useEffect(() => {
    setCurrentPage(1);
  }, [consumos.length]);

  // Calcular los consumos para la página actual
  const totalPages = Math.ceil(consumos.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const consumosPaginaActual = consumos.slice(startIndex, endIndex);

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
    <View style={styles.container}>
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
        ) : consumos.length === 0 ? (
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
      {!isLoading && consumos.length > itemsPerPage && (
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
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
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

