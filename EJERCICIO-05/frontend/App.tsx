import { useRef, useState } from 'react';
import { Button, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

type Viaje = {
  id: number;
  destino: string;
  pais: string;
  fecha: string;
  estado: string;
};

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export default function App() {
  const [id, setId] = useState('1');
  const [estado, setEstado] = useState('');
  const [fecha, setFecha] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [viaje, setViaje] = useState<Viaje | null>(null);
  const enviando = useRef(false);

  async function actualizar() {
    if (enviando.current) return;
    setMensaje('');
    setError('');
    if (!/^\d+$/.test(id.trim()) || !Number.isSafeInteger(Number(id)) || Number(id) < 1) {
      setError('Introduce un identificador entero positivo.');
      return;
    }
    const cambios: { estado?: string; fecha?: string } = {};
    if (estado.trim()) cambios.estado = estado.trim();
    if (fecha.trim()) cambios.fecha = fecha.trim();
    if (!Object.keys(cambios).length) {
      setError('Introduce un estado o una fecha para actualizar.');
      return;
    }
    if (cambios.estado && cambios.estado.length > 120) {
      setError('El estado no puede superar los 120 caracteres.');
      return;
    }
    if (cambios.fecha) {
      const timestamp = Date.parse(cambios.fecha + 'T00:00:00Z');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(cambios.fecha) || !Number.isFinite(timestamp) ||
          new Date(timestamp).toISOString().slice(0, 10) !== cambios.fecha) {
        setError('Introduce una fecha real con formato AAAA-MM-DD.');
        return;
      }
    }
    enviando.current = true;
    setGuardando(true);
    try {
      const respuesta = await fetch(`${API_URL}/viajes/${Number(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cambios),
      });
      if (!respuesta.ok) {
        if (respuesta.status === 404) {
          setError('Viaje no encontrado. Revisa el identificador.');
          return;
        }
        const fallo = await respuesta.json().catch(() => null);
        setError(typeof fallo?.message === 'string' ? fallo.message : 'No se ha podido actualizar el viaje.');
        return;
      }
      const actualizado: Viaje = await respuesta.json();
      setViaje(actualizado);
      setMensaje('Viaje actualizado ✓');
      setEstado('');
      setFecha('');
    } catch {
      setError('No se ha podido conectar. Revisa la IP, el puerto y que NestJS esté arrancado.');
    } finally {
      enviando.current = false;
      setGuardando(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>✈️ Travel Book</Text>
          <Text style={styles.subtitle}>Modifica solo lo que necesites de tu viaje.</Text>
          <Text style={styles.label}>Identificador del viaje</Text>
          <TextInput style={styles.input} accessibilityLabel="Identificador del viaje" keyboardType="number-pad" value={id} onChangeText={setId} editable={!guardando} />
          <Text style={styles.label}>Nuevo estado (opcional)</Text>
          <TextInput style={styles.input} accessibilityLabel="Nuevo estado" placeholder="RESERVADO" value={estado} onChangeText={setEstado} editable={!guardando} maxLength={120} />
          <Text style={styles.label}>Nueva fecha (opcional)</Text>
          <TextInput style={styles.input} accessibilityLabel="Nueva fecha" placeholder="2027-05-20" value={fecha} onChangeText={setFecha} editable={!guardando} autoCapitalize="none" />
          <Text style={styles.hint}>Deja en blanco los campos que quieras conservar.</Text>
          <Button title={guardando ? 'Guardando…' : 'Guardar cambios'} onPress={actualizar} disabled={guardando} color="#0369A1" />
          {mensaje !== '' && <Text style={styles.success}>{mensaje}</Text>}
          {error !== '' && <Text style={styles.error}>{error}</Text>}
          {viaje && (
            <View style={styles.card}>
              <Text style={styles.caption}>ÚLTIMO VIAJE ACTUALIZADO · #{viaje.id}</Text>
              <Text style={styles.destination}>{viaje.destino}</Text>
              <Text style={styles.details}>{viaje.pais}</Text>
              <Text style={styles.details}>📅 {viaje.fecha}</Text>
              <Text style={styles.status}>{viaje.estado}</Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F9FF' },
  flex: { flex: 1 },
  content: { padding: 24, paddingBottom: 48 },
  title: { fontSize: 30, fontWeight: '800', color: '#0C4A6E' },
  subtitle: { color: '#475569', marginTop: 8, marginBottom: 24 },
  label: { fontWeight: '600', color: '#0C4A6E', marginBottom: 6 },
  input: { backgroundColor: '#FFF', padding: 14, borderRadius: 12, marginBottom: 16, color: '#0F172A', borderWidth: 1, borderColor: '#BAE6FD' },
  hint: { color: '#475569', marginBottom: 18 },
  success: { color: '#166534', marginTop: 16 },
  error: { color: '#B91C1C', marginTop: 16 },
  card: { backgroundColor: '#FFF', padding: 20, borderRadius: 18, marginTop: 24 },
  caption: { color: '#0369A1', fontSize: 11, fontWeight: '700' },
  destination: { fontSize: 26, fontWeight: '800', color: '#0C4A6E', marginTop: 12 },
  details: { color: '#475569', marginTop: 8 },
  status: { color: '#0369A1', fontWeight: '800', marginTop: 16 },
});
