import {
  FormularioInfoNutricional,
  type DatosFormularioNutricional,
} from "@/components/formulario-info-nutricional";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { MetaFitColors } from "@/constants/theme";
import { router } from "expo-router";
import { StyleSheet, TouchableOpacity, View } from "react-native";

export default function PantallaInfoNutricional() {
  const manejarVolver = () => {
    router.back();
  };

  const manejarGuardar = (datosFormulario: DatosFormularioNutricional) => {
    console.log("Datos del formulario:", datosFormulario);
    // Lógica para guardar aquí
  };

  return (
    <ThemedView style={estilos.contenedor} lightColor={MetaFitColors.background.white}>
      {/* Header */}
      <View style={estilos.encabezado}>
        <TouchableOpacity onPress={manejarVolver} style={estilos.botonVolver}>
          <IconSymbol name="chevron.left" size={24} color={MetaFitColors.text.primary} />
        </TouchableOpacity>
        <ThemedText style={estilos.tituloEncabezado} lightColor={MetaFitColors.text.primary}>
          Información nutricional
        </ThemedText>
        <View style={estilos.espaciadorEncabezado} />
      </View>

      <FormularioInfoNutricional alGuardar={manejarGuardar} />
    </ThemedView>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: MetaFitColors.background.white,
  },
  encabezado: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: MetaFitColors.border.divider,
  },
  botonVolver: {
    padding: 8,
    marginRight: 8,
  },
  tituloEncabezado: {
    fontSize: 24,
    fontWeight: "bold",
    flex: 1,
  },
  espaciadorEncabezado: {
    width: 40,
  },
});

