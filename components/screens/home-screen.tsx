import { TablaConsumos } from "@/components/tabla-consumos/TablaConsumos";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { MetaFitColors } from "@/constants/theme";
import { obtenerUltimosConsumos, type Consumo } from "@/utils/consumos";
import { Image } from "expo-image";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

type HomeScreenProps = {
  onCargarComidaPress?: () => void;
};

export function HomeScreen({ onCargarComidaPress }: HomeScreenProps) {
  const [todosLosConsumos, setTodosLosConsumos] = useState<Consumo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const cargarConsumos = useCallback(async () => {
    try {
      setIsLoading(true);
      // Obtener todos los consumos (sin límite)
      const consumos = await obtenerUltimosConsumos(1000);
      setTodosLosConsumos(consumos);
    } catch (error) {
      console.error("Error al cargar consumos:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

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

          <TablaConsumos consumos={todosLosConsumos} isLoading={isLoading} />
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
});

