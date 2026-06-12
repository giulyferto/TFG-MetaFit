import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { MetaFitColors } from '@/constants/theme';
import {
  eliminarComida,
  guardarComidaComoPlantilla,
  obtenerComidasAnteriores,
  type ComidaAnterior,
} from '@/utils/comidas';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type NuevaComida = {
  nombre: string;
  cantidad: string;
  energia: string;
  carb: string;
  proteina: string;
  fibra: string;
  grasa: string;
};

const COMIDA_VACIA: NuevaComida = {
  nombre: '',
  cantidad: '',
  energia: '',
  carb: '',
  proteina: '',
  fibra: '',
  grasa: '',
};

export default function ComidasGuardadasScreen() {
  const [comidas, setComidas] = useState<ComidaAnterior[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [nuevaComida, setNuevaComida] = useState<NuevaComida>(COMIDA_VACIA);
  const [guardando, setGuardando] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    cargarComidas();
  }, []);

  const cargarComidas = async () => {
    setLoading(true);
    try {
      const resultado = await obtenerComidasAnteriores(100);
      setComidas(resultado);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar las comidas guardadas.');
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = (comida: ComidaAnterior) => {
    Alert.alert(
      'Eliminar comida',
      `¿Deseas eliminar "${comida.nombre}" de tus comidas guardadas?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await eliminarComida(comida.id);
              setComidas((prev) => prev.filter((c) => c.id !== comida.id));
            } catch {
              Alert.alert('Error', 'No se pudo eliminar la comida.');
            }
          },
        },
      ]
    );
  };

  const handleGuardar = async () => {
    if (!nuevaComida.nombre.trim()) {
      Alert.alert('Error', 'El nombre de la comida es obligatorio.');
      return;
    }
    setGuardando(true);
    try {
      await guardarComidaComoPlantilla({
        nombre: nuevaComida.nombre.trim(),
        cantidad: nuevaComida.cantidad,
        energia: nuevaComida.energia,
        carb: nuevaComida.carb,
        proteina: nuevaComida.proteina,
        fibra: nuevaComida.fibra,
        grasa: nuevaComida.grasa,
      });
      setModalVisible(false);
      setNuevaComida(COMIDA_VACIA);
      await cargarComidas();
    } catch {
      Alert.alert('Error', 'No se pudo guardar la comida.');
    } finally {
      setGuardando(false);
    }
  };

  const renderItem = ({ item }: { item: ComidaAnterior }) => (
    <View style={styles.comidaRow}>
      <View style={styles.comidaInfo}>
        <ThemedText style={styles.comidaNombre} lightColor={MetaFitColors.text.primary}>
          {item.nombre || 'Sin nombre'}
        </ThemedText>
        <ThemedText style={styles.comidaDetalle} lightColor={MetaFitColors.text.tertiary}>
          {[
            item.energia ? `${item.energia} kcal` : null,
            item.proteina ? `P: ${item.proteina}g` : null,
            item.carb ? `C: ${item.carb}g` : null,
          ]
            .filter(Boolean)
            .join(' · ') || 'Sin datos nutricionales'}
        </ThemedText>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleEliminar(item)}
        activeOpacity={0.7}
      >
        <IconSymbol name="trash" size={18} color={MetaFitColors.error} />
      </TouchableOpacity>
    </View>
  );

  return (
    <ThemedView style={styles.container} lightColor={MetaFitColors.background.white}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <IconSymbol name="chevron.left" size={22} color={MetaFitColors.text.secondary} />
        </TouchableOpacity>
        <ThemedText style={styles.title} lightColor={MetaFitColors.text.primary}>
          Comidas guardadas
        </ThemedText>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.7}
        >
          <IconSymbol name="plus" size={20} color={MetaFitColors.text.white} />
        </TouchableOpacity>
      </View>

      {/* Lista */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={MetaFitColors.button.primary} />
        </View>
      ) : comidas.length === 0 ? (
        <View style={styles.centered}>
          <IconSymbol name="fork.knife" size={48} color={MetaFitColors.text.tertiary} />
          <ThemedText style={styles.emptyText} lightColor={MetaFitColors.text.tertiary}>
            No tienes comidas guardadas
          </ThemedText>
          <ThemedText style={styles.emptySubtext} lightColor={MetaFitColors.text.tertiary}>
            Toca + para agregar una nueva
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={comidas}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      {/* Modal agregar comida */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setModalVisible(false);
          setNuevaComida(COMIDA_VACIA);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle} lightColor={MetaFitColors.text.primary}>
                Nueva comida
              </ThemedText>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  setNuevaComida(COMIDA_VACIA);
                }}
                activeOpacity={0.7}
              >
                <IconSymbol name="xmark.circle.fill" size={24} color={MetaFitColors.text.tertiary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <TextInput
                style={styles.input}
                placeholder="Nombre *"
                placeholderTextColor={MetaFitColors.text.tertiary}
                value={nuevaComida.nombre}
                onChangeText={(v) => setNuevaComida((p) => ({ ...p, nombre: v }))}
              />
              <TextInput
                style={styles.input}
                placeholder="Cantidad (ej: 100g)"
                placeholderTextColor={MetaFitColors.text.tertiary}
                value={nuevaComida.cantidad}
                onChangeText={(v) => setNuevaComida((p) => ({ ...p, cantidad: v }))}
              />

              <ThemedText style={styles.inputGroupLabel} lightColor={MetaFitColors.text.tertiary}>
                Información nutricional
              </ThemedText>

              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, styles.inputHalf]}
                  placeholder="Energía (kcal)"
                  placeholderTextColor={MetaFitColors.text.tertiary}
                  keyboardType="numeric"
                  value={nuevaComida.energia}
                  onChangeText={(v) => setNuevaComida((p) => ({ ...p, energia: v }))}
                />
                <TextInput
                  style={[styles.input, styles.inputHalf]}
                  placeholder="Proteína (g)"
                  placeholderTextColor={MetaFitColors.text.tertiary}
                  keyboardType="numeric"
                  value={nuevaComida.proteina}
                  onChangeText={(v) => setNuevaComida((p) => ({ ...p, proteina: v }))}
                />
              </View>
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, styles.inputHalf]}
                  placeholder="Carbohidratos (g)"
                  placeholderTextColor={MetaFitColors.text.tertiary}
                  keyboardType="numeric"
                  value={nuevaComida.carb}
                  onChangeText={(v) => setNuevaComida((p) => ({ ...p, carb: v }))}
                />
                <TextInput
                  style={[styles.input, styles.inputHalf]}
                  placeholder="Grasas (g)"
                  placeholderTextColor={MetaFitColors.text.tertiary}
                  keyboardType="numeric"
                  value={nuevaComida.grasa}
                  onChangeText={(v) => setNuevaComida((p) => ({ ...p, grasa: v }))}
                />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Fibra (g)"
                placeholderTextColor={MetaFitColors.text.tertiary}
                keyboardType="numeric"
                value={nuevaComida.fibra}
                onChangeText={(v) => setNuevaComida((p) => ({ ...p, fibra: v }))}
              />

              <TouchableOpacity
                style={[styles.saveButton, guardando && styles.saveButtonDisabled]}
                onPress={handleGuardar}
                disabled={guardando}
                activeOpacity={0.8}
              >
                {guardando ? (
                  <ActivityIndicator size="small" color={MetaFitColors.text.white} />
                ) : (
                  <ThemedText style={styles.saveButtonText} lightColor={MetaFitColors.text.white}>
                    Guardar comida
                  </ThemedText>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: MetaFitColors.button.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    textAlign: 'center',
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  comidaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MetaFitColors.background.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
    gap: 12,
  },
  comidaInfo: {
    flex: 1,
    gap: 3,
  },
  comidaNombre: {
    fontSize: 15,
    fontWeight: '600',
  },
  comidaDetalle: {
    fontSize: 12,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(224, 82, 82, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  separator: {
    height: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: MetaFitColors.background.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  inputGroupLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 4,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  input: {
    backgroundColor: MetaFitColors.background.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: MetaFitColors.text.primary,
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  inputHalf: {
    flex: 1,
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: MetaFitColors.button.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
