import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Button, FlatList, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';

type Prioridad = 'ALTA' | 'MEDIA' | 'BAJA';
type Destino = { id: number; ciudad: string; pais: string; descripcion: string; prioridad: Prioridad };
const PRIORIDADES: Prioridad[] = ['ALTA', 'MEDIA', 'BAJA'];
const ETIQUETAS: Record<Prioridad, string> = { ALTA: 'Alta', MEDIA: 'Media', BAJA: 'Baja' };
const RANGO: Record<Prioridad, number> = { ALTA: 0, MEDIA: 1, BAJA: 2 };
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
const ordenar = (a: Destino, b: Destino) => RANGO[a.prioridad] - RANGO[b.prioridad] || b.id - a.id;

async function request(path: string, options?: RequestInit) {
  let respuesta: Response;
  try {
    respuesta = await fetch(API_URL + path, options);
  } catch (e) {
    if (options?.signal?.aborted) throw e;
    throw new Error('No se ha podido conectar. Revisa la IP y que NestJS esté arrancado.');
  }
  if (!respuesta.ok) {
    const fallo = await respuesta.json().catch(() => null);
    throw new Error(typeof fallo?.message === 'string' ? fallo.message : 'La operación no se ha completado.');
  }
  return respuesta;
}

async function obtenerDestinos(signal?: AbortSignal): Promise<Destino[]> {
  return (await request('/destinos', { signal })).json();
}

export default function App() {
  const [destinos, setDestinos] = useState<Destino[]>([]);
  const [ciudad, setCiudad] = useState('');
  const [pais, setPais] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [prioridad, setPrioridad] = useState<Prioridad>('MEDIA');
  const [editando, setEditando] = useState<number | null>(null);
  const [cargando, setCargando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const bloqueado = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    obtenerDestinos(controller.signal)
      .then(datos => { if (!controller.signal.aborted) setDestinos(datos); })
      .catch(e => { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'No se pudieron cargar los destinos.'); })
      .finally(() => { if (!controller.signal.aborted) setCargando(false); });
    return () => controller.abort();
  }, []);

  function limpiar() {
    setEditando(null); setCiudad(''); setPais(''); setDescripcion(''); setPrioridad('MEDIA');
  }

  async function recargar() {
    if (bloqueado.current || cargando) return;
    bloqueado.current = true; setCargando(true); setError(''); setMensaje('');
    try { setDestinos(await obtenerDestinos()); }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudo recargar.'); }
    finally { bloqueado.current = false; setCargando(false); }
  }

  async function editar(id: number) {
    if (bloqueado.current || cargando) return;
    bloqueado.current = true; setOcupado(true); setError(''); setMensaje('');
    try {
      const destino: Destino = await (await request(`/destinos/${id}`)).json();
      setEditando(destino.id); setCiudad(destino.ciudad); setPais(destino.pais);
      setDescripcion(destino.descripcion); setPrioridad(destino.prioridad);
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo cargar el destino.'); }
    finally { bloqueado.current = false; setOcupado(false); }
  }

  async function guardar() {
    if (bloqueado.current || cargando) return;
    setError(''); setMensaje('');
    if (![ciudad, pais].every(texto => texto.trim().length > 0 && texto.trim().length <= 120)) {
      setError('Completa ciudad y país (máximo 120 caracteres).'); return;
    }
    if (!descripcion.trim() || descripcion.trim().length > 1000) {
      setError('La descripción debe tener entre 1 y 1000 caracteres.'); return;
    }
    bloqueado.current = true; setOcupado(true);
    let guardado = false;
    try {
      const respuesta = await request(editando === null ? '/destinos' : `/destinos/${editando}`, {
        method: editando === null ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ciudad: ciudad.trim(), pais: pais.trim(), descripcion: descripcion.trim(), prioridad }),
      });
      const destino: Destino = await respuesta.json();
      guardado = true;
      setDestinos(actuales => [...actuales.filter(actual => actual.id !== destino.id), destino].sort(ordenar));
      setMensaje(editando === null ? 'Destino creado ✓' : 'Destino actualizado ✓');
      limpiar();
      setDestinos(await obtenerDestinos());
    } catch (e) {
      setError(guardado ? 'El cambio se guardó, pero no se pudo recargar. Pulsa Recargar.'
        : e instanceof Error ? e.message : 'No se pudo guardar el destino.');
    } finally { bloqueado.current = false; setOcupado(false); }
  }

  async function eliminar(id: number) {
    if (bloqueado.current || cargando) return;
    bloqueado.current = true; setOcupado(true); setError(''); setMensaje('');
    let guardado = false;
    try {
      await request(`/destinos/${id}`, { method: 'DELETE' });
      guardado = true;
      setDestinos(actuales => actuales.filter(destino => destino.id !== id));
      if (editando === id) limpiar();
      setMensaje('Destino eliminado ✓');
      setDestinos(await obtenerDestinos());
    } catch (e) {
      setError(guardado ? 'Se eliminó el destino, pero no se pudo recargar. Pulsa Recargar.'
        : e instanceof Error ? e.message : 'No se pudo eliminar el destino.');
    } finally { bloqueado.current = false; setOcupado(false); }
  }

  function confirmar(destino: Destino) {
    Alert.alert('Eliminar destino', `¿Eliminar ${destino.ciudad}, ${destino.pais}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => { void eliminar(destino.id); } },
    ]);
  }

  const desactivado = ocupado || cargando;
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          data={destinos}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View>
              <Text style={styles.title}>🌍 Wander</Text>
              <Text style={styles.subtitle}>Decide qué lugar quieres descubrir primero</Text>
              <Text style={styles.formTitle}>{editando === null ? 'Nuevo destino' : `Editar destino #${editando}`}</Text>
              <Text style={styles.label}>Ciudad</Text>
              <TextInput accessibilityLabel="Ciudad" style={styles.input} placeholder="Reikiavik" value={ciudad} onChangeText={setCiudad} editable={!desactivado} maxLength={120} />
              <Text style={styles.label}>País</Text>
              <TextInput accessibilityLabel="País" style={styles.input} placeholder="Islandia" value={pais} onChangeText={setPais} editable={!desactivado} maxLength={120} />
              <Text style={styles.label}>Descripción</Text>
              <TextInput accessibilityLabel="Descripción" style={[styles.input, styles.description]} placeholder="Qué te gustaría visitar…" value={descripcion} onChangeText={setDescripcion} editable={!desactivado} maxLength={1000} multiline textAlignVertical="top" />
              <Text style={styles.label}>Prioridad del viaje</Text>
              <View style={styles.priorities}>
                {PRIORIDADES.map(valor => (
                  <View style={styles.priorityOption} key={valor}>
                    <Button title={`${prioridad === valor ? '✓ ' : ''}${ETIQUETAS[valor]}`} accessibilityLabel={`Prioridad ${ETIQUETAS[valor]}`} onPress={() => setPrioridad(valor)} disabled={desactivado} color={prioridad === valor ? '#7C3AED' : '#64748B'} />
                  </View>
                ))}
              </View>
              <Button title={editando === null ? 'Crear destino' : 'Guardar cambios'} onPress={guardar} disabled={desactivado} color="#7C3AED" />
              {editando !== null && <Button title="Cancelar edición" onPress={limpiar} disabled={desactivado} />}
              <View style={styles.spacing}><Button title="Recargar" onPress={recargar} disabled={desactivado} color="#475569" /></View>
              {ocupado && <ActivityIndicator style={styles.spacing} color="#7C3AED" />}
              {error !== '' && <Text style={styles.error}>{error}</Text>}
              {mensaje !== '' && <Text style={styles.success}>{mensaje}</Text>}
              <Text style={styles.formTitle}>Mis destinos</Text>
              <Text style={styles.hint}>Primero prioridad alta; a igualdad, el más reciente.</Text>
              {cargando && <ActivityIndicator size="large" color="#7C3AED" />}
            </View>
          }
          ListEmptyComponent={!cargando ? <Text style={styles.subtitle}>{error ? 'No hay datos disponibles. Pulsa Recargar para reintentar.' : 'Tu lista está vacía. Añade tu primer destino.'}</Text> : undefined}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.city}>{item.ciudad}</Text>
              <Text style={styles.country}>{item.pais}</Text>
              <Text style={styles.detail}>{item.descripcion}</Text>
              <Text style={[styles.badge, item.prioridad === 'ALTA' ? styles.high : item.prioridad === 'BAJA' ? styles.low : styles.medium]}>Prioridad {ETIQUETAS[item.prioridad].toLowerCase()}</Text>
              <Button title="Editar" onPress={() => { void editar(item.id); }} disabled={desactivado} color="#7C3AED" />
              <View style={styles.spacing}><Button title="Eliminar" onPress={() => confirmar(item)} disabled={desactivado} color="#B91C1C" /></View>
            </View>
          )}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF5FF' },
  flex: { flex: 1 },
  content: { padding: 24, paddingBottom: 48 },
  title: { fontSize: 32, fontWeight: '800', color: '#581C87' },
  subtitle: { color: '#64748B', marginTop: 8, marginBottom: 20 },
  formTitle: { color: '#581C87', fontSize: 21, fontWeight: '800', marginTop: 20, marginBottom: 16 },
  label: { color: '#581C87', fontWeight: '600', marginBottom: 6 },
  input: { backgroundColor: '#FFF', padding: 14, borderRadius: 12, color: '#0F172A', borderWidth: 1, borderColor: '#E9D5FF', marginBottom: 16 },
  description: { minHeight: 90 },
  priorities: { flexDirection: 'row', marginHorizontal: -4, marginBottom: 20 },
  priorityOption: { flex: 1, marginHorizontal: 4 },
  spacing: { marginTop: 12 },
  hint: { color: '#64748B', marginBottom: 18 },
  card: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 16 },
  city: { color: '#581C87', fontSize: 24, fontWeight: '800' },
  country: { color: '#7C3AED', fontWeight: '600', marginTop: 5 },
  detail: { color: '#475569', marginTop: 12 },
  badge: { fontWeight: '800', marginVertical: 16 },
  high: { color: '#7C3AED' },
  medium: { color: '#0369A1' },
  low: { color: '#64748B' },
  error: { color: '#B91C1C', marginTop: 16 },
  success: { color: '#166534', marginTop: 16 },
});
