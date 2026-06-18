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
import { obtenerConsumosPaginados, type Consumo } from '@/utils/consumos';
import type { QueryDocumentSnapshot } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PAGE_SIZE = 15;

export default function ComidasGuardadasScreen() {
  const [comidas, setComidas] = useState<ComidaAnterior[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [registro, setRegistro] = useState<Consumo[]>([]);
  const [loadingRegistro, setLoadingRegistro] = useState(false);
  const [loadingMas, setLoadingMas] = useState(false);
  const [cursorRegistro, setCursorRegistro] = useState<QueryDocumentSnapshot | null>(null);
  const [hayMasRegistro, setHayMasRegistro] = useState(false);
  const [guardandoId, setGuardandoId] = useState<string | null>(null);
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

  const abrirModal = async () => {
    setModalVisible(true);
    setLoadingRegistro(true);
    try {
      const { consumos, nextCursor, hayMas } = await obtenerConsumosPaginados(PAGE_SIZE);
      setRegistro(consumos);
      setCursorRegistro(nextCursor);
      setHayMasRegistro(hayMas);
    } catch {
      Alert.alert('Error', 'No se pudo cargar el registro.');
    } finally {
      setLoadingRegistro(false);
    }
  };

  const cargarMasPagina = async () => {
    if (loadingMas || !hayMasRegistro || !cursorRegistro) return;
    setLoadingMas(true);
    try {
      const { consumos, nextCursor, hayMas } = await obtenerConsumosPaginados(PAGE_SIZE, cursorRegistro);
      setRegistro((prev) => [...prev, ...consumos]);
      setCursorRegistro(nextCursor);
      setHayMasRegistro(hayMas);
    } catch {
      // silently ignore
    } finally {
      setLoadingMas(false);
    }
  };

  const handleGuardarDesdeRegistro = async (consumo: Consumo) => {
    setGuardandoId(consumo.id);
    try {
      await guardarComidaComoPlantilla(
        {
          nombre: consumo.nombre || '',
          cantidad: consumo.cantidad || '',
          energia: consumo.energia || '',
          carb: consumo.carb || '',
          proteina: consumo.proteina || '',
          fibra: consumo.fibra || '',
          grasa: consumo.grasa || '',
        },
        consumo.imagenUrl
      );
      setModalVisible(false);
      await cargarComidas();
    } catch {
      Alert.alert('Error', 'No se pudo guardar la comida.');
    } finally {
      setGuardandoId(null);
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

  const renderItem = ({ item }: { item: ComidaAnterior }) => (
    <View style={styles.comidaRow}>
      {item.imagenUrl ? (
        <Image source={{ uri: item.imagenUrl }} style={styles.comidaImagen} />
      ) : (
        <View style={styles.comidaImagenPlaceholder}>
          <IconSymbol name="fork.knife" size={18} color={MetaFitColors.text.tertiary} />
        </View>
      )}
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

  const renderRegistroItem = ({ item }: { item: Consumo }) => {
    const isGuardando = guardandoId === item.id;
    return (
      <TouchableOpacity
        style={styles.registroRow}
        onPress={() => handleGuardarDesdeRegistro(item)}
        activeOpacity={0.7}
        disabled={isGuardando}
      >
        {item.imagenUrl ? (
          <Image source={{ uri: item.imagenUrl }} style={styles.comidaImagen} />
        ) : (
          <View style={styles.comidaImagenPlaceholder}>
            <IconSymbol name="fork.knife" size={18} color={MetaFitColors.text.tertiary} />
          </View>
        )}
        <View style={styles.comidaInfo}>
          <ThemedText style={styles.comidaNombre} lightColor={MetaFitColors.text.primary}>
            {item.nombre || 'Sin nombre'}
          </ThemedText>
          <ThemedText style={styles.comidaDetalle} lightColor={MetaFitColors.text.tertiary}>
            {[
              item.tipoComida || null,
              item.energia ? `${item.energia} kcal` : null,
              item.proteina ? `P: ${item.proteina}g` : null,
              item.carb ? `C: ${item.carb}g` : null,
            ]
              .filter(Boolean)
              .join(' · ') || 'Sin datos nutricionales'}
          </ThemedText>
        </View>
        {isGuardando ? (
          <ActivityIndicator size="small" color={MetaFitColors.button.primary} />
        ) : (
          <IconSymbol name="plus.circle" size={22} color={MetaFitColors.button.primary} />
        )}
      </TouchableOpacity>
    );
  };

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
        <TouchableOpacity style={styles.addButton} onPress={abrirModal} activeOpacity={0.7}>
          <IconSymbol name="plus" size={20} color={MetaFitColors.text.white} />
        </TouchableOpacity>
      </View>

      {/* Lista de comidas guardadas */}
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
            Toca + para agregar desde el registro
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

      {/* Modal: seleccionar del registro */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setModalVisible(false);
          setRegistro([]);
          setCursorRegistro(null);
          setHayMasRegistro(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle} lightColor={MetaFitColors.text.primary}>
                Agregar del registro
              </ThemedText>
              <TouchableOpacity onPress={() => { setModalVisible(false); setRegistro([]); setCursorRegistro(null); setHayMasRegistro(false); }} activeOpacity={0.7}>
                <IconSymbol name="xmark.circle.fill" size={24} color={MetaFitColors.text.tertiary} />
              </TouchableOpacity>
            </View>

            {loadingRegistro ? (
              <View style={styles.modalCentered}>
                <ActivityIndicator size="large" color={MetaFitColors.button.primary} />
              </View>
            ) : registro.length === 0 ? (
              <View style={styles.modalCentered}>
                <IconSymbol name="fork.knife" size={40} color={MetaFitColors.text.tertiary} />
                <ThemedText style={styles.emptyText} lightColor={MetaFitColors.text.tertiary}>
                  Sin comidas en el registro
                </ThemedText>
              </View>
            ) : (
              <FlatList
                data={registro}
                keyExtractor={(item) => item.id}
                renderItem={renderRegistroItem}
                showsVerticalScrollIndicator={false}
                style={styles.registroList}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                onEndReached={cargarMasPagina}
                onEndReachedThreshold={0.3}
                ListFooterComponent={
                  loadingMas ? (
                    <View style={styles.footerLoader}>
                      <ActivityIndicator size="small" color={MetaFitColors.button.primary} />
                    </View>
                  ) : hayMasRegistro ? (
                    <View style={styles.footerLoader} />
                  ) : null
                }
              />
            )}
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
  registroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    gap: 12,
  },
  comidaImagen: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  comidaImagenPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: MetaFitColors.background.elevated,
    alignItems: 'center',
    justifyContent: 'center',
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
    height: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  modalCentered: {
    paddingVertical: 48,
    alignItems: 'center',
    gap: 12,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  registroList: {
    flex: 1,
  },
});
