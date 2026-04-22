import { TablaConsumos } from "@/components/tabla-consumos/TablaConsumos";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { MetaFitColors } from "@/constants/theme";
import { obtenerUltimosConsumos, type Consumo } from "@/utils/consumos";
import { Image } from "expo-image";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type HomeScreenProps = {
  onCargarComidaPress?: () => void;
};

export function HomeScreen({ onCargarComidaPress }: HomeScreenProps) {
  const insets = useSafeAreaInsets();
  const [todosLosConsumos, setTodosLosConsumos] = useState<Consumo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const cargarConsumos = useCallback(async () => {
    try {
      setIsLoading(true);
      const consumos = await obtenerUltimosConsumos(1000);
      setTodosLosConsumos(consumos);
    } catch (error) {
      console.error("Error al cargar consumos:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarConsumos();
  }, [cargarConsumos]);

  useFocusEffect(
    useCallback(() => {
      cargarConsumos();
    }, [cargarConsumos])
  );

  const handleCargarComidaPress = () => {
    if (onCargarComidaPress) {
      onCargarComidaPress();
    } else {
      router.push("/registro-comida");
    }
  };

  const totalConsumos = todosLosConsumos.length;
  const consumosAlta = todosLosConsumos.filter(c => c.calificacion === "Alta").length;

  return (
    <ThemedView style={[styles.container, { paddingTop: Math.max(insets.top, Platform.OS === "ios" ? 59 : 24) + 16 }]} lightColor={MetaFitColors.background.white}>
      {/* Fixed top: header + stats + button */}
      <View style={styles.topSection}>
        <View style={styles.headerSection}>
          <Image
            source={require("@/assets/images/MetaFitLogo.png")}
            style={styles.logo}
            contentFit="contain"
          />
          <View>
            <ThemedText style={styles.greeting} lightColor={MetaFitColors.text.secondary}>
              Bienvenido a
            </ThemedText>
            <ThemedText style={styles.appTitle} lightColor={MetaFitColors.text.primary}>
              MetaFit
            </ThemedText>
          </View>
        </View>

        {!isLoading && totalConsumos > 0 && (
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <ThemedText style={styles.statValue} lightColor={MetaFitColors.button.primary}>
                {totalConsumos}
              </ThemedText>
              <ThemedText style={styles.statLabel} lightColor={MetaFitColors.text.secondary}>
                Registros
              </ThemedText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <ThemedText style={styles.statValue} lightColor={MetaFitColors.calificacion.alta}>
                {consumosAlta}
              </ThemedText>
              <ThemedText style={styles.statLabel} lightColor={MetaFitColors.text.secondary}>
                Calificación Alta
              </ThemedText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <ThemedText style={styles.statValue} lightColor={MetaFitColors.calificacion.media}>
                {totalConsumos > 0 ? Math.round((consumosAlta / totalConsumos) * 100) : 0}%
              </ThemedText>
              <ThemedText style={styles.statLabel} lightColor={MetaFitColors.text.secondary}>
                Puntuación
              </ThemedText>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={styles.cargarComidaButton}
          onPress={handleCargarComidaPress}
          activeOpacity={0.85}
        >
          <View style={styles.buttonContent}>
            <View style={styles.buttonIconCircle}>
              <ThemedText style={styles.buttonIcon}>+</ThemedText>
            </View>
            <ThemedText style={styles.cargarComidaButtonText} lightColor={MetaFitColors.text.white}>
              Registrar comida
            </ThemedText>
          </View>
        </TouchableOpacity>
      </View>

      {/* Consumos section: takes remaining space, pagination always visible */}
      <View style={styles.consumosSection}>
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle} lightColor={MetaFitColors.text.primary}>
            Últimos consumos
          </ThemedText>
          {totalConsumos > 0 && (
            <View style={styles.countBadge}>
              <ThemedText style={styles.countBadgeText} lightColor={MetaFitColors.text.secondary}>
                {totalConsumos}
              </ThemedText>
            </View>
          )}
        </View>

        <TablaConsumos consumos={todosLosConsumos} isLoading={isLoading} itemsPerPage={3} />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MetaFitColors.background.white,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  topSection: {
    gap: 0,
  },
  headerSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 4,
    marginBottom: 16,
  },
  logo: {
    width: 52,
    height: 52,
  },
  greeting: {
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: MetaFitColors.background.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    gap: 3,
  },
  statDivider: {
    width: 1,
    backgroundColor: MetaFitColors.border.light,
    marginVertical: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
  },
  cargarComidaButton: {
    backgroundColor: MetaFitColors.button.primary,
    paddingVertical: 15,
    borderRadius: 14,
    marginBottom: 20,
    shadowColor: "#2C3E50",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  buttonIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonIcon: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    lineHeight: 22,
  },
  cargarComidaButtonText: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  consumosSection: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: MetaFitColors.background.card,
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
