import { ThemedText } from "@/components/ui/themed-text";
import { MetaFitColors } from "@/constants/theme";
import { TextInput, View } from "react-native";
import { estilos } from "./estilos";

type InputEdadProps = {
  valor: string;
  error: boolean;
  onChangeText: (valor: string) => void;
  editable?: boolean;
};

export function InputEdad({ valor, error, onChangeText, editable = true }: InputEdadProps) {
  return (
    <View style={estilos.contenedorInput}>
      <View style={estilos.contenedorInputWrapper}>
        <TextInput
          style={[estilos.input, !editable && estilos.inputReadOnly]}
          placeholder="Edad"
          placeholderTextColor={MetaFitColors.text.tertiary}
          value={valor}
          onChangeText={onChangeText}
          keyboardType="numeric"
          editable={editable}
        />
        {error && (
          <ThemedText
            style={estilos.textoError}
            lightColor={MetaFitColors.error}
          >
            Solo se permiten números
          </ThemedText>
        )}
      </View>
    </View>
  );
}

