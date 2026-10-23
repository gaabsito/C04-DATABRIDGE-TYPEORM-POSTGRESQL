import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Button, FlatList, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';

type Evento = { id: number; nombre: string; ciudad: string; categoria: string; fecha: string };
type Filtros = { ciudad: string; categoria: string };
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

async function obtenerEventos(ciudad: string, categoria: string, signal?: AbortSignal): Promise<Evento[]> {
  const parametros: string[] = [];
  if (ciudad.trim()) parametros.push('ciudad=' + encodeURIComponent(ciudad.trim()));
  if (categoria.trim()) parametros.push('categoria=' + encodeURIComponent(categoria.trim()));
  const ruta = '/eventos' + (parametros.length ? '?' + parametros.join('&') : '');
  let respuesta: Response;
  try {
    respuesta = await fetch(API_URL + ruta, { signal });
  } catch (e) {
    if (signal?.aborted) throw e;
    throw new Error('No se ha podido conectar. Revisa la IP y que NestJS esté arrancado.');
  }
  if (!respuesta.ok) {
    const fallo = await respuesta.json().catch(() => null);
    throw new Error(typeof fallo?.message === 'string' ? fallo.message : 'No se han podido consultar los eventos.');
  }
  return respuesta.json();
}

export default function App() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [ciudad, setCiudad] = useState('');
  const [categoria, setCategoria] = useState('');
  const [aplicados, setAplicados] = useState<Filtros | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const bloqueado = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    obtenerEventos('', '', controller.signal)
      .then(datos => {
        if (!controller.signal.aborted) {
          setEventos(datos);
          setAplicados({ ciudad: '', categoria: '' });
        }
      })
      .catch(e => { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'No se pudieron cargar los eventos.'); })
      .finally(() => { if (!controller.signal.aborted) setCargando(false); });
    return () => controller.abort();
  }, []);

  async function consultar(ciudadElegida: string, categoriaElegida: string) {
    if (bloqueado.current || cargando) return;
    setError('');
    const filtros = { ciudad: ciudadElegida.trim(), categoria: categoriaElegida.trim() };
    if (filtros.ciudad.length > 120 || filtros.categoria.length > 120) {
      setError('Los filtros no pueden superar los 120 caracteres.'); return;
    }
    bloqueado.current = true; setCargando(true);
    try {
      const datos = await obtenerEventos(filtros.ciudad, filtros.categoria);
      setEventos(datos);
      setAplicados(filtros);
    } catch (e) {
      setError((e instanceof Error ? e.message : 'No se pudo filtrar.') + ' Se conservan los últimos resultados disponibles.');
    } finally { bloqueado.current = false; setCargando(false); }
  }

  function mostrarTodos() {
    setCiudad(''); setCategoria('');
    // Pasamos valores explícitos: no reutilizamos el estado anterior al borrarlo.
    void consultar('', '');
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          data={eventos}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View>
              <Text style={styles.title}>🎟️ Event Radar</Text>
              <Text style={styles.subtitle}>Encuentra eventos por ciudad y categoría</Text>
              <Text style={styles.label}>Ciudad (opcional)</Text>
              <TextInput accessibilityLabel="Ciudad" style={styles.input} placeholder="Zaragoza" value={ciudad} onChangeText={setCiudad} editable={!cargando} autoCorrect={false} autoCapitalize="none" maxLength={120} />
              <Text style={styles.label}>Categoría (opcional)</Text>
              <TextInput accessibilityLabel="Categoría" style={styles.input} placeholder="Tecnologia" value={categoria} onChangeText={setCategoria} editable={!cargando} autoCorrect={false} autoCapitalize="none" maxLength={120} />
              <Text style={styles.hint}>Los ejemplos usan Tecnologia y Musica, sin tilde. La coincidencia es exacta.</Text>
              <Button title="Aplicar filtros" onPress={() => { void consultar(ciudad, categoria); }} disabled={cargando} color="#0369A1" />
              <View style={styles.spacing}><Button title="Mostrar todos" onPress={mostrarTodos} disabled={cargando} color="#475569" /></View>
              {cargando && <ActivityIndicator style={styles.spacing} size="large" color="#0369A1" />}
              {error !== '' && <Text style={styles.error}>{error}</Text>}
              {aplicados && (
                <View style={styles.summary}>
                  <Text style={styles.summaryText}>Mostrando: {aplicados.ciudad || 'Todas las ciudades'} · {aplicados.categoria || 'Todas las categorías'}</Text>
                  <Text style={styles.count}>{eventos.length} {eventos.length === 1 ? 'evento' : 'eventos'}</Text>
                </View>
              )}
            </View>
          }
          ListEmptyComponent={!cargando ? <Text style={styles.subtitle}>{error ? 'No hay resultados disponibles. Reintenta la consulta.' : 'No hay eventos que coincidan con los filtros.'}</Text> : undefined}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.eventTitle}>{item.nombre}</Text>
              <Text style={styles.details}>{item.ciudad} · {item.categoria}</Text>
              <Text style={styles.date}>📅 {item.fecha}</Text>
            </View>
          )}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F9FF' },
  flex: { flex: 1 },
  content: { padding: 24, paddingBottom: 48 },
  title: { fontSize: 30, fontWeight: '800', color: '#0C4A6E' },
  subtitle: { color: '#64748B', marginTop: 8, marginBottom: 20 },
  label: { color: '#0C4A6E', fontWeight: '600', marginBottom: 6 },
  input: { color: '#0F172A', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#BAE6FD', borderRadius: 12, padding: 14, marginBottom: 16 },
  hint: { color: '#475569', marginBottom: 18, fontSize: 12 },
  spacing: { marginTop: 12 },
  error: { color: '#B91C1C', marginTop: 16 },
  summary: { marginVertical: 22 },
  summaryText: { color: '#0369A1', fontWeight: '600' },
  count: { color: '#0C4A6E', fontWeight: '800', marginTop: 8 },
  card: { backgroundColor: '#FFF', borderRadius: 18, padding: 20, marginBottom: 14 },
  eventTitle: { color: '#0C4A6E', fontWeight: '800', fontSize: 21 },
  details: { color: '#64748B', marginTop: 8 },
  date: { color: '#0369A1', fontWeight: '600', marginTop: 14 },
});
