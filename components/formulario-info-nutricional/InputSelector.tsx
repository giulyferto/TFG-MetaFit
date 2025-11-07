import { IconSymbol } from "@/components/ui/icon-symbol";
import { MetaFitColors } from "@/constants/theme";
import { TextInput, TouchableOpacity, View } from "react-native";
import { estilos } from "./estilos";

type InputSelectorProps = {
  placeholder: string;
  valor: string;
  onPress: () => void;
};

export function InputSelector({
  placeholder,
  valor,
  onPress,
}: InputSelectorProps) {
  return (
    <TouchableOpacity
      style={estilos.contenedorInput}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={estilos.contenedorInputConChevron}>
        <TextInput
          style={estilos.input}
          placeholder={placeholder}
          placeholderTextColor={MetaFitColors.text.tertiary}
          value={valor}
          editable={false}
          pointerEvents="none"
        />
        <View style={estilos.contenedorChevron}>
          <IconSymbol
            name="chevron.right"
            size={20}
            color={MetaFitColors.text.tertiary}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
}

