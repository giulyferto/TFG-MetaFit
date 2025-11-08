import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { MetaFitColors } from "@/constants/theme";
import { Image } from "expo-image";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

type Consumo = {
  id: string;
  calificacion: "OK" | "Alto" | "Bajo";
  descripcion: string;
};

type HomeScreenProps = {
  onCargarComidaPress?: () => void;
};

export function HomeScreen({ onCargarComidaPress }: HomeScreenProps) {
  // Datos de ejemplo - estos vendrán de Firebase más adelante
  const ultimosConsumos: Consumo[] = [
    {
      id: "1",
      calificacion: "OK",
      descripcion: "Almuerzo - Lunes 6 de Octubre 2025",
    },
    {
      id: "2",
      calificacion: "Alto",
      descripcion: "Snack - Lunes 6 de Octubre 2025",
    },
    {
      id: "3",
      calificacion: "Bajo",
      descripcion: "Desayuno - Lunes 6 de Octubre 2025",
    },
  ];

  const handleCargarComidaPress = () => {
    if (onCargarComidaPress) {
      onCargarComidaPress();
    } else {
      // Navegar a la pantalla de cargar comida (cuando se cree)
      console.log("Cargar comida");
    }
  };

  const getCalificacionColor = (calificacion: Consumo["calificacion"]) => {
    switch (calificacion) {
      case "OK":
        return MetaFitColors.calificacion.ok;
      case "Alto":
        return MetaFitColors.calificacion.alto;
      case "Bajo":
        return MetaFitColors.calificacion.bajo;
      default:
        return MetaFitColors.text.secondary;
    }
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
            {ultimosConsumos.map((consumo, index) => (
              <View key={consumo.id}>
                <View style={styles.tableRow}>
                  <ThemedText
                    style={[
                      styles.calificacionText,
                      { color: getCalificacionColor(consumo.calificacion) },
                    ]}
                  >
                    {consumo.calificacion}
                  </ThemedText>
                  <ThemedText
                    style={styles.descripcionText}
                    lightColor={MetaFitColors.text.primary}
                  >
                    {consumo.descripcion}
                  </ThemedText>
                </View>
                {index < ultimosConsumos.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
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
    marginTop: 20,
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
});

