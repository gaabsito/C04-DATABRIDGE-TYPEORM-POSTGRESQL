import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Button, FlatList, SafeAreaView, StyleSheet, Text, View } from 'react-native';

type Libro = { id: number; titulo: string; autor: string; genero: string; leido: boolean };
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export default function App() {
  const [libros, setLibros] = useState<Libro[]>([]);
  const [cargando, setCargando] = useState(true);
  const [ocupado, setOcupado] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const bloqueado = useRef(false);

  const cargar = useCallback(async (signal?: AbortSignal) => {
    const respuesta = await fetch(API_URL + '/libros', { signal });
    if (!respuesta.ok) throw new Error('No se ha podido cargar la biblioteca.');
    const datos: Libro[] = await respuesta.json();
    return datos;
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    cargar(controller.signal)
      .then(datos => {
        if (!controller.signal.aborted) setLibros(datos);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError('No se ha podido conectar. Revisa la IP y que NestJS esté arrancado.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setCargando(false);
      });
    return () => controller.abort();
  }, [cargar]);

  async function recargar() {
    if (bloqueado.current || cargando) return;
    bloqueado.current = true;
    setCargando(true);
    setError('');
    setMensaje('');
    try {
      setLibros(await cargar());
    } catch {
      setError('No se ha podido recargar la biblioteca. Revisa la conexión.');
    } finally {
      bloqueado.current = false;
      setCargando(false);
    }
  }

  async function modificar(libro: Libro, accion: 'eliminar' | 'leido') {
    if (bloqueado.current || cargando) return;
    bloqueado.current = true;
    setOcupado(libro.id);
    setError('');
    setMensaje('');
    let guardado = false;
    try {
      const respuesta = await fetch(`${API_URL}/libros/${libro.id}${accion === 'leido' ? '/leido' : ''}`, {
        method: accion === 'eliminar' ? 'DELETE' : 'PATCH',
      });
      if (!respuesta.ok) {
        setError(respuesta.status === 404 ? 'El libro ya no existe. Pulsa Recargar para actualizar la lista.' : 'No se ha podido guardar el cambio.');
        return;
      }
      guardado = true;
      // Solo cambiamos la interfaz después de que el servidor confirme.
      setLibros(actuales => accion === 'eliminar'
        ? actuales.filter(actual => actual.id !== libro.id)
        : actuales.map(actual => actual.id === libro.id ? { ...actual, leido: true } : actual));
      setMensaje(accion === 'eliminar' ? 'Libro eliminado ✓' : 'Libro marcado como leído ✓');
      // Volvemos a consultar PostgreSQL para sincronizar la colección completa.
      setLibros(await cargar());
    } catch {
      setError(guardado
        ? 'El cambio se guardó, pero no se pudo recargar la lista. Pulsa Recargar.'
        : 'No se ha podido conectar. La lista no se ha modificado.');
    } finally {
      bloqueado.current = false;
      setOcupado(null);
    }
  }

  function confirmar(libro: Libro) {
    Alert.alert('Eliminar libro', `¿Quieres eliminar «${libro.titulo}»?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => { void modificar(libro, 'eliminar'); } },
    ]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📚 My Library</Text>
        <Text style={styles.subtitle}>Tu biblioteca guardada en PostgreSQL</Text>
        <Button title="Recargar" onPress={recargar} disabled={cargando || ocupado !== null} color="#6D28D9" />
        {mensaje !== '' && <Text style={styles.success}>{mensaje}</Text>}
        {error !== '' && <Text style={styles.error}>{error}</Text>}
      </View>
      {cargando && <ActivityIndicator size="large" color="#6D28D9" />}
      {!cargando && (
        <FlatList
          data={libros}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.subtitle}>{error ? 'No hay datos disponibles. Pulsa Recargar para reintentar.' : 'Tu biblioteca está vacía.'}</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.bookTitle}>{item.titulo}</Text>
              <Text style={styles.details}>{item.autor}</Text>
              <Text style={styles.details}>{item.genero}</Text>
              <Text style={[styles.badge, item.leido && styles.read]}>{item.leido ? '✓ Leído' : 'Pendiente de leer'}</Text>
              {ocupado === item.id && <ActivityIndicator color="#6D28D9" />}
              {!item.leido && <Button title="Marcar como leído" onPress={() => { void modificar(item, 'leido'); }} disabled={ocupado !== null} color="#6D28D9" />}
              <View style={styles.deleteButton}>
                <Button title="Eliminar" onPress={() => confirmar(item)} disabled={ocupado !== null} color="#B91C1C" />
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F3FF' },
  header: { padding: 24, paddingBottom: 12 },
  title: { fontSize: 30, fontWeight: '800', color: '#3B0764' },
  subtitle: { color: '#64748B', marginTop: 8, marginBottom: 16 },
  list: { paddingHorizontal: 24, paddingBottom: 24 },
  card: { backgroundColor: '#FFF', padding: 20, borderRadius: 18, marginBottom: 16 },
  bookTitle: { color: '#3B0764', fontSize: 22, fontWeight: '800' },
  details: { color: '#64748B', marginTop: 6 },
  badge: { color: '#92400E', fontWeight: '700', marginVertical: 16 },
  read: { color: '#166534' },
  deleteButton: { marginTop: 10 },
  error: { color: '#B91C1C', marginTop: 12 },
  success: { color: '#166534', marginTop: 12 },
});
