import { ThemedText } from "@/components/ui/themed-text";
import { MetaFitColors } from "@/constants/theme";
import { TouchableOpacity, View } from "react-native";
import { estilos } from "./estilos";

type InputEjercicioProps = {
  valor: string;
  onChangeValue: (valor: string) => void;
  editable?: boolean;
};

export function InputEjercicio({ valor, onChangeValue, editable = true }: InputEjercicioProps) {
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
            !editable && estilos.botonToggleDisabled,
          ]}
          onPress={() => editable && onChangeValue("Sí")}
          disabled={!editable}
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
            !editable && estilos.botonToggleDisabled,
          ]}
          onPress={() => editable && onChangeValue("No")}
          disabled={!editable}
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

