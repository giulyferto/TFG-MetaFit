import { ThemedText } from "@/components/ui/themed-text";
import { MetaFitColors } from "@/constants/theme";
import type { Consumo } from "@/utils/consumos";
import { Image } from "expo-image";
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

  useEffect(() => {
    setCurrentPage(1);
  }, [consumos.length]);

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

  const getCalificacionBg = (calificacion: Consumo["calificacion"]) => {
    switch (calificacion) {
      case "Alta":
        return "rgba(74, 158, 107, 0.1)";
      case "Media":
        return "rgba(201, 148, 58, 0.1)";
      case "Baja":
        return "rgba(201, 72, 72, 0.1)";
      default:
        return MetaFitColors.background.elevated;
    }
  };

  const getCalificacionTexto = (calificacion: Consumo["calificacion"]) => {
    if (!calificacion) return "Sin calificar";
    return calificacion;
  };

  if (isLoading) {
    return (
      <View style={styles.stateContainer}>
        <ActivityIndicator size="small" color={MetaFitColors.button.primary} />
        <ThemedText style={styles.stateText} lightColor={MetaFitColors.text.secondary}>
          Cargando consumos...
        </ThemedText>
      </View>
    );
  }

  if (consumos.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconWrapper}>
          <ThemedText style={styles.emptyIcon}>🥗</ThemedText>
        </View>
        <ThemedText style={styles.emptyTitle} lightColor={MetaFitColors.text.primary}>
          Sin registros aún
        </ThemedText>
        <ThemedText style={styles.emptySubtitle} lightColor={MetaFitColors.text.secondary}>
          Registra tu primera comida para comenzar a rastrear tu nutrición
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Cards list */}
      <View style={styles.cardsList}>
        {consumosPaginaActual.map((consumo) => (
          <View key={consumo.id} style={styles.consumoCard}>
            <View style={styles.cardRow}>
              {/* Left: badge + description */}
              <View style={styles.cardContent}>
                <View
                  style={[
                    styles.ratingBadge,
                    { backgroundColor: getCalificacionBg(consumo.calificacion) },
                  ]}
                >
                  <View
                    style={[
                      styles.ratingDot,
                      { backgroundColor: getCalificacionColor(consumo.calificacion) },
                    ]}
                  />
                  <ThemedText
                    style={styles.ratingText}
                    lightColor={getCalificacionColor(consumo.calificacion)}
                  >
                    {getCalificacionTexto(consumo.calificacion)}
                  </ThemedText>
                </View>
                <ThemedText
                  style={styles.descripcionText}
                  lightColor={MetaFitColors.text.primary}
                  numberOfLines={2}
                >
                  {consumo.descripcion}
                </ThemedText>
              </View>

              {/* Right: food image thumbnail */}
              {consumo.imagenUrl && (
                <Image
                  source={{ uri: consumo.imagenUrl }}
                  style={styles.thumbnail}
                  contentFit="cover"
                />
              )}
            </View>
          </View>
        ))}
      </View>

      {/* Pagination */}
      {consumos.length > itemsPerPage && (
        <View style={styles.paginationContainer}>
          <TouchableOpacity
            style={[
              styles.paginationButton,
              currentPage === 1 && styles.paginationButtonDisabled,
            ]}
            onPress={handlePreviousPage}
            disabled={currentPage === 1}
            activeOpacity={0.7}
          >
            <ThemedText
              style={styles.paginationButtonText}
              lightColor={
                currentPage === 1
                  ? MetaFitColors.text.tertiary
                  : MetaFitColors.text.primary
              }
            >
              ← Anterior
            </ThemedText>
          </TouchableOpacity>

          <ThemedText style={styles.paginationInfo} lightColor={MetaFitColors.text.tertiary}>
            {currentPage} / {totalPages}
          </ThemedText>

          <TouchableOpacity
            style={[
              styles.paginationButton,
              currentPage === totalPages && styles.paginationButtonDisabled,
            ]}
            onPress={handleNextPage}
            disabled={currentPage === totalPages}
            activeOpacity={0.7}
          >
            <ThemedText
              style={styles.paginationButtonText}
              lightColor={
                currentPage === totalPages
                  ? MetaFitColors.text.tertiary
                  : MetaFitColors.text.primary
              }
            >
              Siguiente →
            </ThemedText>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    justifyContent: "space-between",
  },
  stateContainer: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  stateText: {
    fontSize: 14,
  },
  emptyContainer: {
    paddingBottom: 36,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: MetaFitColors.background.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
  },
  emptyIconWrapper: {
    paddingTop: 36,
    paddingBottom: 12,
    alignItems: "center",
  },
  emptyIcon: {
    fontSize: 44,
    lineHeight: 54,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  cardsList: {
    flex: 1,
    gap: 10,
  },
  consumoCard: {
    flex: 1,
    backgroundColor: MetaFitColors.background.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
  },
  cardRow: {
    flex: 1,
    flexDirection: "row",
    gap: 10,
  },
  cardContent: {
    flex: 1,
    gap: 8,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: 10,
    alignSelf: "center",
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  ratingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  descripcionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingHorizontal: 4,
  },
  paginationButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: MetaFitColors.background.card,
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
  },
  paginationButtonDisabled: {
    opacity: 0.35,
  },
  paginationButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  paginationInfo: {
    fontSize: 13,
    fontWeight: "500",
  },
});
