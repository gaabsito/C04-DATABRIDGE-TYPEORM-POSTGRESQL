import { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View } from 'react-native';

type Mascota = {
  id: number;
  nombre: string;
  raza: string;
  edad: number;
  ciudad: string;
  nivelEnergia: string;
};

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
const MASCOTA_ID = 1;

export default function App() {
  const [mascota, setMascota] = useState<Mascota | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    async function cargarMascota() {
      try {
        const respuesta = await fetch(`${API_URL}/mascotas/${MASCOTA_ID}`, {
          signal: controller.signal,
        });
        if (respuesta.status === 404) throw new Error('Mascota no encontrada. Revisa el identificador.');
        if (!respuesta.ok) throw new Error('La API no ha respondido correctamente.');
        const datos: Mascota = await respuesta.json();
        if (!controller.signal.aborted) setMascota(datos);
      } catch (e) {
        if (!controller.signal.aborted) {
          setError(e instanceof Error && e.message !== 'Network request failed' && e.message !== 'Failed to fetch'
            ? e.message
            : 'No se ha podido conectar. Revisa la IP, el puerto y que NestJS esté arrancado.');
        }
      } finally {
        if (!controller.signal.aborted) setCargando(false);
      }
    }
    void cargarMascota();
    return () => controller.abort();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.eyebrow}>PET PROFILE</Text>
      {cargando && <ActivityIndicator size="large" color="#2563EB" accessibilityLabel="Cargando mascota" />}
      {error !== '' && <Text style={styles.error}>{error}</Text>}
      {!cargando && error === '' && mascota && (
        <View style={styles.card}>
          <Text style={styles.emoji}>🐶</Text>
          <Text style={styles.title}>{mascota.nombre}</Text>
          <Text style={styles.breed}>{mascota.raza}</Text>
          <Text style={styles.details}>{mascota.edad} años · {mascota.ciudad}</Text>
          <View style={styles.energy}>
            <Text style={styles.energyText}>⚡ Nivel de energía: {mascota.nivelEnergia}</Text>
          </View>
          <Text style={styles.caption}>Ficha recuperada de PostgreSQL</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#EEF6FF' },
  eyebrow: { textAlign: 'center', color: '#2563EB', fontWeight: '800', letterSpacing: 2, marginBottom: 20 },
  card: { backgroundColor: '#FFF', padding: 28, borderRadius: 24, alignItems: 'center' },
  emoji: { fontSize: 56, marginBottom: 12 },
  title: { fontSize: 28, fontWeight: '800', color: '#0F172A' },
  breed: { color: '#334155', fontSize: 17, marginTop: 6 },
  details: { color: '#64748B', marginTop: 8 },
  energy: { backgroundColor: '#DBEAFE', borderRadius: 14, padding: 12, marginTop: 20 },
  energyText: { color: '#1D4ED8', fontWeight: '700', textAlign: 'center' },
  caption: { color: '#64748B', fontSize: 12, marginTop: 20 },
  error: { color: '#B91C1C', textAlign: 'center' },
});
