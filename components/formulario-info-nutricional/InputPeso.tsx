import { ThemedText } from "@/components/themed-text";
import { MetaFitColors } from "@/constants/theme";
import { TextInput, View } from "react-native";
import { estilos } from "./estilos";

type InputPesoProps = {
  valor: string;
  error: string | null;
  onChangeText: (valor: string) => void;
};

export function InputPeso({ valor, error, onChangeText }: InputPesoProps) {
  return (
    <View style={estilos.contenedorInput}>
      <View style={estilos.contenedorInputWrapper}>
        <View style={estilos.contenedorInputConUnidad}>
          <TextInput
            style={estilos.inputConUnidad}
            placeholder="Peso"
            placeholderTextColor={MetaFitColors.text.tertiary}
            value={valor}
            onChangeText={onChangeText}
            keyboardType="numeric"
          />
          <View style={estilos.contenedorUnidad}>
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

