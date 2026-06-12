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
import { useRouter } from 'expo-router';
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

export default function InformacionNutricionalScreen() {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [perfilData, setPerfilData] = useState<Partial<DatosFormularioNutricional> | null>(null);
  const formularioRef = useRef<FormularioInfoNutricionalRef>(null);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const perfil = await getNutritionalProfile();
      if (perfil) {
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

      const perfilRef = doc(db, 'perfilesNutricionales', user.uid);
      await updateDoc(perfilRef, datosParaGuardar);

      await new Promise(resolve => setTimeout(resolve, 300));
      await loadProfile();
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
      if (formularioRef.current) {
        const datosActuales = formularioRef.current.obtenerDatos();
        await manejarGuardar(datosActuales);
      } else {
        Alert.alert('Error', 'No se pudieron obtener los datos del formulario');
      }
    } else {
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
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <IconSymbol name="chevron.left" size={20} color={MetaFitColors.text.secondary} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle} lightColor={MetaFitColors.text.primary}>
          Información nutricional
        </ThemedText>
        <TouchableOpacity onPress={handleEditToggle} style={styles.editButton} activeOpacity={0.7}>
          <IconSymbol
            name={isEditing ? 'checkmark.circle' : 'pencil'}
            size={24}
            color={isEditing ? MetaFitColors.button.primary : MetaFitColors.text.secondary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ThemedText style={styles.subtitle} lightColor={MetaFitColors.text.secondary}>
          {isEditing ? 'Editando información nutricional' : 'Tu información nutricional'}
        </ThemedText>

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: MetaFitColors.border.light,
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: MetaFitColors.background.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: MetaFitColors.background.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
});
