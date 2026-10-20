import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, SafeAreaView, StyleSheet, Text, View } from 'react-native';

type Pelicula = {
  id: number;
  titulo: string;
  genero: string;
  anio: number;
  puntuacion: number | string;
  favorita: boolean;
};

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export default function App() {
  const [peliculas, setPeliculas] = useState<Pelicula[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    async function cargarPeliculas() {
      try {
        const respuesta = await fetch(API_URL + '/peliculas', { signal: controller.signal });
        if (!respuesta.ok) throw new Error('La API no ha respondido correctamente');
        const datos: Pelicula[] = await respuesta.json();
        if (!controller.signal.aborted) setPeliculas(datos);
      } catch {
        if (!controller.signal.aborted) {
          setError('No se ha podido cargar la cartelera. Revisa la IP, el puerto y que NestJS esté arrancado.');
        }
      } finally {
        if (!controller.signal.aborted) setCargando(false);
      }
    }
    void cargarPeliculas();
    return () => controller.abort();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🎬 CineBox</Text>
        <Text style={styles.subtitle}>Mi cartelera · Datos de PostgreSQL</Text>
      </View>
      {cargando && <ActivityIndicator size="large" color="#7C3AED" />}
      {error !== '' && <Text style={styles.error}>{error}</Text>}
      {!cargando && error === '' && (
        <FlatList
          data={peliculas}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text>No hay películas en la colección.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.movie}>{item.titulo}</Text>
                <Text
                  style={[styles.heart, item.favorita && styles.favorite]}
                  accessibilityLabel={item.favorita ? 'Película favorita' : 'Película no favorita'}
                >
                  {item.favorita ? '♥' : '♡'}
                </Text>
              </View>
              <Text style={styles.subtitle}>{item.genero} · {item.anio}</Text>
              <Text style={styles.score}>⭐ {Number(item.puntuacion).toFixed(1)}</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { padding: 24, paddingBottom: 20 },
  title: { fontSize: 30, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  subtitle: { color: '#64748B', marginTop: 4 },
  list: { paddingHorizontal: 20, paddingBottom: 24 },
  card: { backgroundColor: '#FFF', padding: 18, borderRadius: 16, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  movie: { flex: 1, fontSize: 18, fontWeight: '700', color: '#0F172A' },
  heart: { fontSize: 30, color: '#64748B', marginLeft: 12 },
  favorite: { color: '#E11D48' },
  score: { fontWeight: '700', marginTop: 12, color: '#5B21B6' },
  error: { color: '#B91C1C', paddingHorizontal: 24 },
});
