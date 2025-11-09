import {
  FormularioInfoNutricional,
  type DatosFormularioNutricional,
} from "@/components/formulario-info-nutricional";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { MetaFitColors } from "@/constants/theme";
import { auth, db } from "@/firebase";
import { router } from "expo-router";
import { doc, setDoc } from "firebase/firestore";
import { useState } from "react";
import { Alert, StyleSheet, TouchableOpacity, View } from "react-native";

export default function PantallaInfoNutricional() {
  const [isSaving, setIsSaving] = useState(false);

  const manejarVolver = async () => {
    // No permitir volver si el formulario no está completo
    const user = auth.currentUser;
    if (user) {
      // Verificar si tiene perfil completo
      const { hasCompleteNutritionalProfile } = await import('@/utils/nutritional-profile');
      const hasProfile = await hasCompleteNutritionalProfile();
      
      if (hasProfile) {
        // Si tiene perfil completo, permitir volver
        router.back();
      } else {
        // Si no tiene perfil completo, no permitir volver (debe completar el formulario)
        Alert.alert(
          "Formulario requerido",
          "Debes completar tu información nutricional para continuar usando la aplicación."
        );
      }
    } else {
      // Si no hay usuario, redirigir a login
      router.replace('/login');
    }
  };

  const manejarGuardar = async (datosFormulario: DatosFormularioNutricional) => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Error", "No hay usuario autenticado");
      return;
    }

    // Validar que todos los campos requeridos estén completos
    if (
      !datosFormulario.edad ||
      !datosFormulario.sexo ||
      !datosFormulario.altura ||
      !datosFormulario.peso ||
      !datosFormulario.ejercicio ||
      !datosFormulario.preferenciaNutricional ||
      !datosFormulario.objetivos
    ) {
      Alert.alert("Error", "Por favor completa todos los campos requeridos");
      return;
    }

    setIsSaving(true);

    try {
      // Guardar el perfil nutricional en Firestore
      const perfilRef = doc(db, "perfilesNutricionales", user.uid);
      await setDoc(perfilRef, {
        ...datosFormulario,
        userId: user.uid,
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString(),
        completado: true,
      });

      console.log("Perfil nutricional guardado exitosamente");
      
      // Navegar a la pantalla de inicio
      router.replace("/(tabs)");
    } catch (error: any) {
      console.error("Error al guardar perfil nutricional:", error);
      Alert.alert("Error", "No se pudo guardar el perfil. Por favor intenta de nuevo.");
    } finally {
      setIsSaving(false);
    }
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

      <FormularioInfoNutricional alGuardar={manejarGuardar} isSaving={isSaving} />
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

