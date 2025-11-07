import { ThemedText } from "@/components/themed-text";
import { MetaFitColors } from "@/constants/theme";
import { TouchableOpacity, View } from "react-native";
import { estilos } from "./estilos";

type InputEjercicioProps = {
  valor: string;
  onChangeValue: (valor: string) => void;
};

export function InputEjercicio({ valor, onChangeValue }: InputEjercicioProps) {
  return (
    <View style={estilos.contenedorEjercicio}>
      <ThemedText
        style={estilos.etiquetaEjercicio}
        lightColor={MetaFitColors.text.primary}
      >
        ¿Realiza ejercicio?
      </ThemedText>
      <View style={estilos.grupoBotones}>
        <TouchableOpacity
          style={[
            estilos.botonToggle,
            valor === "Sí" && estilos.botonToggleActivo,
          ]}
          onPress={() => onChangeValue("Sí")}
        >
          <ThemedText
            style={estilos.textoBotonToggle}
            lightColor={MetaFitColors.text.primary}
          >
            Sí
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            estilos.botonToggle,
            valor === "No" && estilos.botonToggleActivo,
          ]}
          onPress={() => onChangeValue("No")}
        >
          <ThemedText
            style={estilos.textoBotonToggle}
            lightColor={MetaFitColors.text.primary}
          >
            No
          </ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

