import { ThemedText } from "@/components/ui/themed-text";
import { MetaFitColors } from "@/constants/theme";
import { TextInput, View } from "react-native";
import { estilos } from "./estilos";

type InputPesoProps = {
  valor: string;
  error: string | null;
  onChangeText: (valor: string) => void;
  editable?: boolean;
};

export function InputPeso({ valor, error, onChangeText, editable = true }: InputPesoProps) {
  return (
    <View style={estilos.contenedorInput}>
      <View style={estilos.contenedorInputWrapper}>
        <View style={[estilos.contenedorInputConUnidad, !editable && estilos.contenedorInputConUnidadReadOnly]}>
          <TextInput
            style={[estilos.inputConUnidad, !editable && estilos.inputConUnidadReadOnly]}
            placeholder="Peso"
            placeholderTextColor={MetaFitColors.text.tertiary}
            value={valor}
            onChangeText={onChangeText}
            keyboardType="numeric"
            editable={editable}
          />
          <View style={[estilos.contenedorUnidad, !editable && estilos.contenedorUnidadReadOnly]}>
            <ThemedText
              style={estilos.textoUnidad}
              lightColor={MetaFitColors.text.secondary}
            >
              kg
            </ThemedText>
          </View>
        </View>
        {error && (
          <ThemedText
            style={estilos.textoError}
            lightColor={MetaFitColors.error}
          >
            {error}
          </ThemedText>
        )}
      </View>
    </View>
  );
}

