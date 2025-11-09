import {
  FormularioInfoNutricional,
  type DatosFormularioNutricional,
  type FormularioInfoNutricionalRef,
} from '@/components/formulario-info-nutricional';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { MetaFitColors } from '@/constants/theme';
import { auth, db } from '@/firebase';
import { getNutritionalProfile } from '@/utils/nutritional-profile';
import { doc, updateDoc } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ConfiguracionScreen() {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [perfilData, setPerfilData] = useState<Partial<DatosFormularioNutricional> | null>(null);
  const formularioRef = useRef<FormularioInfoNutricionalRef>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const perfil = await getNutritionalProfile();
      if (perfil) {
        // Convertir los datos del perfil al formato del formulario
        // Crear un nuevo objeto para forzar la actualización en React
        const nuevoPerfilData = {
          edad: String(perfil.edad || ''),
          sexo: String(perfil.sexo || ''),
          altura: String(perfil.altura || ''),
          peso: String(perfil.peso || ''),
          ejercicio: String(perfil.ejercicio || 'Sí'),
          preferenciaNutricional: String(perfil.preferenciaNutricional || ''),
          restricciones: Array.isArray(perfil.restricciones) ? [...perfil.restricciones] : [],
          objetivos: String(perfil.objetivos || ''),
        };
        setPerfilData(nuevoPerfilData);
      } else {
        setPerfilData(null);
      }
    } catch (error) {
      console.error('Error al cargar perfil:', error);
      Alert.alert('Error', 'No se pudo cargar el perfil nutricional');
    } finally {
      setLoading(false);
    }
  };

  const manejarGuardar = async (datosFormulario: DatosFormularioNutricional) => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'No hay usuario autenticado');
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
      Alert.alert('Error', 'Por favor completa todos los campos requeridos');
      return;
    }

    setIsSaving(true);

    try {
      // Preparar los datos para guardar en Firestore
      const datosParaGuardar = {
        edad: String(datosFormulario.edad).trim(),
        sexo: String(datosFormulario.sexo).trim(),
        altura: String(datosFormulario.altura).trim(),
        peso: String(datosFormulario.peso).trim(),
        ejercicio: String(datosFormulario.ejercicio).trim(),
        preferenciaNutricional: String(datosFormulario.preferenciaNutricional).trim(),
        restricciones: Array.isArray(datosFormulario.restricciones) 
          ? datosFormulario.restricciones 
          : [],
        objetivos: String(datosFormulario.objetivos).trim(),
        userId: user.uid,
        fechaActualizacion: new Date().toISOString(),
        completado: true,
      };

      // Actualizar el perfil nutricional en Firestore usando updateDoc
      const perfilRef = doc(db, 'perfilesNutricionales', user.uid);
      await updateDoc(perfilRef, datosParaGuardar);
      
      // Esperar un momento para asegurar que Firestore haya procesado la actualización
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Recargar el perfil con los datos actualizados
      await loadProfile();
      
      // Salir del modo edición después de guardar exitosamente
      setIsEditing(false);
      
      Alert.alert('Éxito', 'Tu perfil nutricional ha sido actualizado correctamente');
    } catch (error: any) {
      console.error('Error al actualizar perfil nutricional:', error);
      Alert.alert(
        'Error', 
        `No se pudo actualizar el perfil: ${error.message || 'Error desconocido'}. Por favor intenta de nuevo.`
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditToggle = async () => {
    if (isEditing) {
      // Si está en modo edición, guardar antes de salir
      if (formularioRef.current) {
        const datosActuales = formularioRef.current.obtenerDatos();
        // Guardar los datos
        await manejarGuardar(datosActuales);
        // manejarGuardar ya cambia isEditing a false después de guardar exitosamente
      } else {
        Alert.alert('Error', 'No se pudieron obtener los datos del formulario');
      }
    } else {
      // Si está en modo read-only, entrar en modo edición
      setIsEditing(true);
    }
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]} lightColor={MetaFitColors.background.white}>
        <ActivityIndicator size="large" color={MetaFitColors.button.primary} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container} lightColor={MetaFitColors.background.white}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <ThemedText style={styles.title} lightColor={MetaFitColors.text.primary}>
              Configuración
            </ThemedText>
            <TouchableOpacity
              onPress={handleEditToggle}
              style={styles.editButton}
              activeOpacity={0.7}
            >
              <IconSymbol
                name={isEditing ? "checkmark.circle" : "pencil"}
                size={24}
                color={isEditing ? MetaFitColors.button.primary : MetaFitColors.text.secondary}
              />
            </TouchableOpacity>
          </View>
          <ThemedText style={styles.subtitle} lightColor={MetaFitColors.text.secondary}>
            {isEditing ? "Editando información nutricional" : "Tu información nutricional"}
          </ThemedText>
        </View>

        {/* Formulario */}
        <FormularioInfoNutricional
          ref={formularioRef}
          alGuardar={manejarGuardar}
          isSaving={isSaving}
          initialData={perfilData || undefined}
          readOnly={!isEditing}
        />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MetaFitColors.background.white,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingTop: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    paddingTop: 10,
    flex: 1,
  },
  editButton: {
    padding: 8,
    marginLeft: 12,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
});

