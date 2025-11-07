import { ThemedText } from "@/components/themed-text";
import { MetaFitColors } from "@/constants/theme";
import { useFormularioNutricional } from "@/hooks/useFormularioNutricional";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { InputAltura } from "./InputAltura";
import { InputEdad } from "./InputEdad";
import { InputEjercicio } from "./InputEjercicio";
import { InputObjetivos } from "./InputObjetivos";
import { InputPeso } from "./InputPeso";
import { InputPreferenciaNutricional } from "./InputPreferenciaNutricional";
import { InputRestricciones } from "./InputRestricciones";
import { InputSexo } from "./InputSexo";
import type { ObjetivoNutricional } from "./ModalObjetivos";
import type { PreferenciaNutricional } from "./ModalPreferenciaNutricional";
import type { RestriccionNutricional } from "./ModalRestricciones";
import { estilos } from "./estilos";

export type DatosFormularioNutricional = {
  edad: string;
  sexo: string;
  altura: string;
  peso: string;
  ejercicio: string;
  preferenciaNutricional: string;
  restricciones: string[];
  objetivos: string;
};

type PropsFormularioInfoNutricional = {
  alGuardar?: (datosFormulario: DatosFormularioNutricional) => void;
};

export function FormularioInfoNutricional({
  alGuardar,
}: PropsFormularioInfoNutricional) {
  const {
    datosFormulario,
    errorEdad,
    errorAltura,
    errorPeso,
    mostrarModalSexo,
    setMostrarModalSexo,
    mostrarModalPreferenciaNutricional,
    setMostrarModalPreferenciaNutricional,
    mostrarModalRestricciones,
    setMostrarModalRestricciones,
    mostrarModalObjetivos,
    setMostrarModalObjetivos,
    actualizarCampo,
    actualizarEdad,
    actualizarAltura,
    actualizarPeso,
    toggleRestriccion,
  } = useFormularioNutricional();

  const manejarGuardar = () => {
    if (alGuardar) {
      alGuardar(datosFormulario);
    } else {
      console.log("Datos del formulario:", datosFormulario);
    }
  };

  const manejarSeleccionarSexo = (sexo: "Masculino" | "Femenino") => {
    actualizarCampo("sexo", sexo);
  };

  const manejarSeleccionarPreferenciaNutricional = (
    preferencia: PreferenciaNutricional
  ) => {
    actualizarCampo("preferenciaNutricional", preferencia);
  };

  const manejarSeleccionarObjetivo = (objetivo: ObjetivoNutricional) => {
    actualizarCampo("objetivos", objetivo);
  };

  return (
    <>
      <ScrollView
        style={estilos.vistaScroll}
        contentContainerStyle={estilos.contenidoScroll}
        showsVerticalScrollIndicator={false}
      >
        <InputEdad
          valor={datosFormulario.edad}
          error={errorEdad}
          onChangeText={actualizarEdad}
        />

        <InputSexo
          valor={datosFormulario.sexo}
          mostrarModal={mostrarModalSexo}
          onAbrirModal={() => setMostrarModalSexo(true)}
          onCerrarModal={() => setMostrarModalSexo(false)}
          onSeleccionar={manejarSeleccionarSexo}
        />

        <InputAltura
          valor={datosFormulario.altura}
          error={errorAltura}
          onChangeText={actualizarAltura}
        />

        <InputPeso
          valor={datosFormulario.peso}
          error={errorPeso}
          onChangeText={actualizarPeso}
        />

        <InputEjercicio
          valor={datosFormulario.ejercicio}
          onChangeValue={(valor) => actualizarCampo("ejercicio", valor)}
        />

        <InputPreferenciaNutricional
          valor={datosFormulario.preferenciaNutricional}
          mostrarModal={mostrarModalPreferenciaNutricional}
          onAbrirModal={() => setMostrarModalPreferenciaNutricional(true)}
          onCerrarModal={() => setMostrarModalPreferenciaNutricional(false)}
          onSeleccionar={manejarSeleccionarPreferenciaNutricional}
        />

        <InputRestricciones
          valores={datosFormulario.restricciones}
          mostrarModal={mostrarModalRestricciones}
          onAbrirModal={() => setMostrarModalRestricciones(true)}
          onCerrarModal={() => setMostrarModalRestricciones(false)}
          onToggleRestriccion={(restriccion: RestriccionNutricional) =>
            toggleRestriccion(restriccion)
          }
        />

        <InputObjetivos
          valor={datosFormulario.objetivos}
          mostrarModal={mostrarModalObjetivos}
          onAbrirModal={() => setMostrarModalObjetivos(true)}
          onCerrarModal={() => setMostrarModalObjetivos(false)}
          onSeleccionar={manejarSeleccionarObjetivo}
        />
      </ScrollView>

      <View style={estilos.contenedorBoton}>
        <TouchableOpacity
          style={estilos.botonGuardar}
          onPress={manejarGuardar}
        >
          <ThemedText
            style={estilos.textoBotonGuardar}
            lightColor={MetaFitColors.text.white}
          >
            Guardar
          </ThemedText>
        </TouchableOpacity>
      </View>
    </>
  );
}

