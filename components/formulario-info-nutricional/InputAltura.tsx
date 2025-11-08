import { ThemedText } from "@/components/ui/themed-text";
import { MetaFitColors } from "@/constants/theme";
import { TextInput, View } from "react-native";
import { estilos } from "./estilos";

type InputAlturaProps = {
  valor: string;
  error: string | null;
  onChangeText: (valor: string) => void;
};

export function InputAltura({ valor, error, onChangeText }: InputAlturaProps) {
  return (
    <View style={estilos.contenedorInput}>
      <View style={estilos.contenedorInputWrapper}>
        <View style={estilos.contenedorInputConUnidad}>
          <TextInput
            style={estilos.inputConUnidad}
            placeholder="Altura"
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
              cm
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

