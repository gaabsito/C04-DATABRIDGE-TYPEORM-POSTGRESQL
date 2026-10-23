import { useRef, useState } from 'react';
import { Button, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

type Restaurante = {
  id: number;
  nombre: string;
  tipo: string;
  ciudad: string;
  puntuacion: number | string;
  precioMedio: number | string;
};

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export default function App() {
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [puntuacion, setPuntuacion] = useState('9');
  const [precioMedio, setPrecioMedio] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [guardado, setGuardado] = useState<Restaurante | null>(null);
  const enviando = useRef(false);

  async function guardar() {
    if (enviando.current) return;
    setMensaje('');
    setError('');
    const nota = Number(puntuacion.trim().replace(',', '.'));
    const precio = Number(precioMedio.trim().replace(',', '.'));
    if (![nombre, tipo, ciudad].every(campo => campo.trim().length > 0 && campo.trim().length <= 120)) {
      setError('Completa nombre, tipo y ciudad (máximo 120 caracteres por campo).');
      return;
    }
    if (!puntuacion.trim() || !Number.isFinite(nota) || nota < 0 || nota > 10) {
      setError('La puntuación debe estar entre 0 y 10.');
      return;
    }
    if (!precioMedio.trim() || !Number.isFinite(precio) || precio < 0 || precio > 999999.99) {
      setError('Introduce un precio medio entre 0 y 999999,99 €.');
      return;
    }
    enviando.current = true;
    setGuardando(true);
    try {
      const respuesta = await fetch(API_URL + '/restaurantes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombre.trim(), tipo: tipo.trim(), ciudad: ciudad.trim(), puntuacion: nota, precioMedio: precio }),
      });
      if (!respuesta.ok) {
        const fallo = await respuesta.json().catch(() => null);
        setError(typeof fallo?.message === 'string' ? fallo.message : 'No se ha podido guardar el restaurante.');
        return;
      }
      // La tarjeta representa la respuesta del servidor, no los valores locales.
      const restaurante: Restaurante = await respuesta.json();
      setGuardado(restaurante);
      setMensaje('Restaurante guardado ✓');
      setNombre('');
      setTipo('');
      setCiudad('');
      setPrecioMedio('');
      setPuntuacion('9');
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
          <Text style={styles.title}>🍜 Food Spots</Text>
          <Text style={styles.subtitle}>Guarda un restaurante en PostgreSQL</Text>
          <Text style={styles.label}>Nombre</Text>
          <TextInput accessibilityLabel="Nombre" style={styles.input} placeholder="La Trattoria" value={nombre} onChangeText={setNombre} editable={!guardando} maxLength={120} />
          <Text style={styles.label}>Tipo de cocina</Text>
          <TextInput accessibilityLabel="Tipo de cocina" style={styles.input} placeholder="Italiano" value={tipo} onChangeText={setTipo} editable={!guardando} maxLength={120} />
          <Text style={styles.label}>Ciudad</Text>
          <TextInput accessibilityLabel="Ciudad" style={styles.input} placeholder="Zaragoza" value={ciudad} onChangeText={setCiudad} editable={!guardando} maxLength={120} />
          <Text style={styles.label}>Puntuación (0–10)</Text>
          <TextInput accessibilityLabel="Puntuación" style={styles.input} keyboardType="decimal-pad" value={puntuacion} onChangeText={setPuntuacion} editable={!guardando} />
          <Text style={styles.label}>Precio medio por persona (€)</Text>
          <TextInput accessibilityLabel="Precio medio" style={styles.input} placeholder="25,50" keyboardType="decimal-pad" value={precioMedio} onChangeText={setPrecioMedio} editable={!guardando} />
          <Button title={guardando ? 'Guardando…' : 'Guardar restaurante'} onPress={guardar} disabled={guardando} color="#C2410C" />
          {mensaje !== '' && <Text style={styles.success}>{mensaje}</Text>}
          {error !== '' && <Text style={styles.error}>{error}</Text>}
          {guardado && (
            <View style={styles.card}>
              <Text style={styles.caption}>ÚLTIMO RESTAURANTE GUARDADO · #{guardado.id}</Text>
              <Text style={styles.restaurant}>{guardado.nombre}</Text>
              <Text style={styles.details}>{guardado.tipo} · {guardado.ciudad}</Text>
              <Text style={styles.details}>⭐ {Number(guardado.puntuacion).toFixed(1)}</Text>
              <Text style={styles.price}>{Number(guardado.precioMedio).toFixed(2)} € por persona</Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF7ED' },
  flex: { flex: 1 },
  content: { padding: 24, paddingBottom: 48 },
  title: { fontSize: 30, fontWeight: '800', color: '#431407' },
  subtitle: { color: '#9A3412', marginTop: 6, marginBottom: 24 },
  label: { color: '#431407', fontWeight: '600', marginBottom: 6 },
  input: { backgroundColor: '#FFF', padding: 14, borderRadius: 12, marginBottom: 16, color: '#0F172A', borderWidth: 1, borderColor: '#FED7AA' },
  success: { color: '#166534', marginTop: 16 },
  error: { color: '#B91C1C', marginTop: 16 },
  card: { backgroundColor: '#FFF', padding: 20, borderRadius: 18, marginTop: 24 },
  caption: { color: '#9A3412', fontSize: 11, fontWeight: '700' },
  restaurant: { fontSize: 22, fontWeight: '800', color: '#431407', marginTop: 10 },
  details: { color: '#57534E', marginTop: 8 },
  price: { color: '#C2410C', fontWeight: '800', fontSize: 18, marginTop: 12 },
});
