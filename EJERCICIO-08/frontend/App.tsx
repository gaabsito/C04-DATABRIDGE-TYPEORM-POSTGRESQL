import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Button, FlatList, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';

type Cancion = { id: number; titulo: string; artista: string };
type Playlist = { id: number; nombre: string; canciones: Cancion[] };
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

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
    throw new Error(typeof fallo?.message === 'string' ? fallo.message : 'La operación no ha terminado correctamente.');
  }
  return respuesta;
}

async function obtenerPlaylist(id: number, signal?: AbortSignal): Promise<Playlist> {
  return (await request(`/playlists/${id}`, { signal })).json();
}

export default function App() {
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [id, setId] = useState('1');
  const [titulo, setTitulo] = useState('');
  const [artista, setArtista] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const bloqueado = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    obtenerPlaylist(1, controller.signal)
      .then(datos => { if (!controller.signal.aborted) setPlaylist(datos); })
      .catch(e => { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'No se pudo cargar la playlist.'); })
      .finally(() => { if (!controller.signal.aborted) setCargando(false); });
    return () => controller.abort();
  }, []);

  async function cargarSeleccionada() {
    if (bloqueado.current || cargando) return;
    const numero = Number(id.trim());
    setError(''); setMensaje('');
    if (!/^\d+$/.test(id.trim()) || !Number.isInteger(numero) || numero < 1 || numero > 2147483647) {
      setError('Introduce un identificador entero positivo válido.'); return;
    }
    bloqueado.current = true; setCargando(true); setPlaylist(null);
    try {
      setPlaylist(await obtenerPlaylist(numero));
      setTitulo(''); setArtista('');
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo cargar la playlist.'); }
    finally { bloqueado.current = false; setCargando(false); }
  }

  async function agregar() {
    if (bloqueado.current || cargando) return;
    setError(''); setMensaje('');
    if (!playlist || !/^\d+$/.test(id.trim()) || Number(id) !== playlist.id) {
      setError('Carga primero la playlist a la que quieres añadir la canción.'); return;
    }
    if (![titulo, artista].every(texto => texto.trim().length > 0 && texto.trim().length <= 120)) {
      setError('Completa título y artista (máximo 120 caracteres).'); return;
    }
    const playlistId = playlist.id;
    bloqueado.current = true; setGuardando(true);
    let guardado = false;
    try {
      const respuesta = await request('/playlists/canciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo: titulo.trim(), artista: artista.trim(), playlistId }),
      });
      const cancion: Cancion = await respuesta.json();
      guardado = true;
      setPlaylist(actual => actual && actual.id === playlistId
        ? { ...actual, canciones: [...actual.canciones, cancion].sort((a, b) => a.id - b.id) }
        : actual);
      setTitulo(''); setArtista('');
      setMensaje('Canción añadida a la playlist ✓');
      // GET vuelve a cargar las canciones a través de la relación de PostgreSQL.
      setPlaylist(await obtenerPlaylist(playlistId));
    } catch (e) {
      setError(guardado ? 'La canción se guardó, pero no se pudo recargar. Pulsa Cargar playlist.'
        : e instanceof Error ? e.message : 'No se pudo añadir la canción.');
    } finally { bloqueado.current = false; setGuardando(false); }
  }

  const ocupado = cargando || guardando;
  const seleccionCargada = playlist !== null && /^\d+$/.test(id.trim()) && Number(id) === playlist.id;
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          data={playlist?.canciones ?? []}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View>
              <Text style={styles.title}>🎵 My Playlists</Text>
              <Text style={styles.subtitle}>Una playlist, muchas canciones</Text>
              <Text style={styles.label}>Identificador de la playlist</Text>
              <TextInput accessibilityLabel="Identificador de la playlist" style={styles.input} keyboardType="number-pad" value={id} onChangeText={setId} editable={!ocupado} />
              <Button title="Cargar playlist" onPress={cargarSeleccionada} disabled={ocupado} color="#7C3AED" />
              {ocupado && <ActivityIndicator style={styles.spacing} color="#7C3AED" />}
              {error !== '' && <Text style={styles.error}>{error}</Text>}
              {mensaje !== '' && <Text style={styles.success}>{mensaje}</Text>}
              {playlist && (
                <View>
                  <Text style={styles.playlistName}>{playlist.nombre}</Text>
                  <Text style={styles.subtitle}>Playlist #{playlist.id} · {playlist.canciones.length} canciones</Text>
                  <Text style={styles.formTitle}>Añadir a «{playlist.nombre}»</Text>
                  {!seleccionCargada && <Text style={styles.hint}>Pulsa Cargar playlist para cambiar la selección.</Text>}
                  <Text style={styles.label}>Título de la canción</Text>
                  <TextInput accessibilityLabel="Título de la canción" style={styles.input} placeholder="Run Boy Run" value={titulo} onChangeText={setTitulo} editable={!ocupado && seleccionCargada} maxLength={120} />
                  <Text style={styles.label}>Artista</Text>
                  <TextInput accessibilityLabel="Artista" style={styles.input} placeholder="Woodkid" value={artista} onChangeText={setArtista} editable={!ocupado && seleccionCargada} maxLength={120} />
                  <Button title={guardando ? 'Añadiendo…' : 'Añadir canción'} onPress={agregar} disabled={ocupado || !seleccionCargada} color="#7C3AED" />
                  <Text style={styles.formTitle}>Canciones</Text>
                </View>
              )}
            </View>
          }
          ListEmptyComponent={!cargando && playlist ? <Text style={styles.subtitle}>Esta playlist todavía no tiene canciones.</Text> : undefined}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.songTitle}>♫ {item.titulo}</Text>
              <Text style={styles.artist}>{item.artista}</Text>
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
  title: { fontSize: 30, fontWeight: '800', color: '#581C87' },
  subtitle: { color: '#64748B', marginTop: 8, marginBottom: 20 },
  label: { fontWeight: '600', color: '#581C87', marginBottom: 6 },
  input: { backgroundColor: '#FFF', padding: 14, borderRadius: 12, color: '#0F172A', borderWidth: 1, borderColor: '#E9D5FF', marginBottom: 16 },
  playlistName: { fontSize: 26, fontWeight: '800', color: '#581C87', marginTop: 24 },
  formTitle: { fontSize: 20, fontWeight: '700', color: '#581C87', marginVertical: 18 },
  hint: { color: '#92400E', marginBottom: 14 },
  spacing: { marginTop: 16 },
  card: { backgroundColor: '#FFF', padding: 18, borderRadius: 16, marginBottom: 12 },
  songTitle: { color: '#581C87', fontSize: 18, fontWeight: '700' },
  artist: { color: '#64748B', marginTop: 6 },
  success: { color: '#166534', marginTop: 16 },
  error: { color: '#B91C1C', marginTop: 16 },
});
