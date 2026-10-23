import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Button, FlatList, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';

type Sneaker = { id: number; marca: string; modelo: string; precio: number | string; talla: number; stock: number };
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
    const error = await respuesta.json().catch(() => null);
    throw new Error(typeof error?.message === 'string' ? error.message : `La operación ha fallado (${respuesta.status}).`);
  }
  return respuesta;
}

async function obtenerLista(signal?: AbortSignal): Promise<Sneaker[]> {
  return (await request('/sneakers', { signal })).json();
}

export default function App() {
  const [items, setItems] = useState<Sneaker[]>([]);
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [precio, setPrecio] = useState('');
  const [talla, setTalla] = useState('');
  const [stock, setStock] = useState('0');
  const [editando, setEditando] = useState<number | null>(null);
  const [cargando, setCargando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const bloqueado = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    obtenerLista(controller.signal)
      .then(datos => { if (!controller.signal.aborted) setItems(datos); })
      .catch(e => { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'No se pudo cargar la colección.'); })
      .finally(() => { if (!controller.signal.aborted) setCargando(false); });
    return () => controller.abort();
  }, []);

  function limpiar() {
    setEditando(null);
    setMarca(''); setModelo(''); setPrecio(''); setTalla(''); setStock('0');
  }

  async function recargar() {
    if (bloqueado.current || cargando) return;
    bloqueado.current = true;
    setCargando(true); setError(''); setMensaje('');
    try { setItems(await obtenerLista()); }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudo recargar.'); }
    finally { bloqueado.current = false; setCargando(false); }
  }

  async function editar(id: number) {
    if (bloqueado.current || cargando) return;
    bloqueado.current = true; setOcupado(true); setError(''); setMensaje('');
    try {
      const item: Sneaker = await (await request(`/sneakers/${id}`)).json();
      setEditando(item.id); setMarca(item.marca); setModelo(item.modelo);
      setPrecio(String(item.precio)); setTalla(String(item.talla)); setStock(String(item.stock));
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo cargar la sneaker.'); }
    finally { bloqueado.current = false; setOcupado(false); }
  }

  async function guardar() {
    if (bloqueado.current || cargando) return;
    setError(''); setMensaje('');
    const precioNumero = Number(precio.trim().replace(',', '.'));
    const tallaNumero = Number(talla.trim());
    const stockNumero = Number(stock.trim());
    if (![marca, modelo].every(texto => texto.trim().length > 0 && texto.trim().length <= 120)) {
      setError('Completa marca y modelo (máximo 120 caracteres).'); return;
    }
    if (!precio.trim() || !Number.isFinite(precioNumero) || precioNumero < 0 || precioNumero > 9999.99) {
      setError('El precio debe estar entre 0 y 9999,99 €.'); return;
    }
    if (!talla.trim() || !Number.isInteger(tallaNumero) || tallaNumero < 1 || tallaNumero > 100) {
      setError('La talla debe ser un entero entre 1 y 100.'); return;
    }
    if (!stock.trim() || !Number.isInteger(stockNumero) || stockNumero < 0 || stockNumero > 2147483647) {
      setError('El stock debe ser un entero entre 0 y 2147483647.'); return;
    }
    bloqueado.current = true; setOcupado(true);
    let guardado = false;
    try {
      const respuesta = await request(editando === null ? '/sneakers' : `/sneakers/${editando}`, {
        method: editando === null ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marca: marca.trim(), modelo: modelo.trim(), precio: precioNumero, talla: tallaNumero, stock: stockNumero }),
      });
      const item: Sneaker = await respuesta.json();
      guardado = true;
      setItems(actuales => [...actuales.filter(actual => actual.id !== item.id), item].sort((a, b) => b.id - a.id));
      setMensaje(editando === null ? 'Sneaker creada ✓' : 'Sneaker actualizada ✓');
      limpiar();
      setItems(await obtenerLista());
    } catch (e) {
      setError(guardado ? 'El cambio se guardó, pero no se pudo recargar la colección. Pulsa Recargar.' : e instanceof Error ? e.message : 'No se pudo guardar.');
    } finally { bloqueado.current = false; setOcupado(false); }
  }

  async function eliminar(id: number) {
    if (bloqueado.current || cargando) return;
    bloqueado.current = true; setOcupado(true); setError(''); setMensaje('');
    let guardado = false;
    try {
      await request(`/sneakers/${id}`, { method: 'DELETE' });
      guardado = true;
      setItems(actuales => actuales.filter(item => item.id !== id));
      if (editando === id) limpiar();
      setMensaje('Sneaker eliminada ✓');
      setItems(await obtenerLista());
    } catch (e) {
      setError(guardado ? 'Se eliminó la sneaker, pero no se pudo recargar. Pulsa Recargar.' : e instanceof Error ? e.message : 'No se pudo eliminar.');
    } finally { bloqueado.current = false; setOcupado(false); }
  }

  function confirmar(item: Sneaker) {
    Alert.alert('Eliminar sneaker', `¿Eliminar ${item.marca} ${item.modelo}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => { void eliminar(item.id); } },
    ]);
  }

  const desactivado = ocupado || cargando;
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          data={items}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View>
              <Text style={styles.title}>👟 Sneaker Vault</Text>
              <Text style={styles.subtitle}>Tu colección conectada a PostgreSQL</Text>
              <Text style={styles.formTitle}>{editando === null ? 'Nueva sneaker' : `Editar sneaker #${editando}`}</Text>
              <Text style={styles.label}>Marca</Text>
              <TextInput accessibilityLabel="Marca" style={styles.input} value={marca} onChangeText={setMarca} placeholder="Nike" editable={!desactivado} maxLength={120} />
              <Text style={styles.label}>Modelo</Text>
              <TextInput accessibilityLabel="Modelo" style={styles.input} value={modelo} onChangeText={setModelo} placeholder="Air Max 1" editable={!desactivado} maxLength={120} />
              <Text style={styles.label}>Precio (€)</Text>
              <TextInput accessibilityLabel="Precio" style={styles.input} value={precio} onChangeText={setPrecio} placeholder="149,99" keyboardType="decimal-pad" editable={!desactivado} />
              <Text style={styles.label}>Talla entera</Text>
              <TextInput accessibilityLabel="Talla" style={styles.input} value={talla} onChangeText={setTalla} placeholder="42" keyboardType="number-pad" editable={!desactivado} />
              <Text style={styles.label}>Stock (unidades)</Text>
              <TextInput accessibilityLabel="Stock" style={styles.input} value={stock} onChangeText={setStock} keyboardType="number-pad" editable={!desactivado} />
              <Button title={editando === null ? 'Crear sneaker' : 'Guardar cambios'} onPress={guardar} disabled={desactivado} color="#0F766E" />
              {editando !== null && <Button title="Cancelar edición" onPress={limpiar} disabled={desactivado} />}
              <View style={styles.spacing}><Button title="Recargar colección" onPress={recargar} disabled={desactivado} color="#0F766E" /></View>
              {ocupado && <ActivityIndicator color="#0F766E" />}
              {mensaje !== '' && <Text style={styles.success}>{mensaje}</Text>}
              {error !== '' && <Text style={styles.error}>{error}</Text>}
              <Text style={styles.formTitle}>Mi colección</Text>
              {cargando && <ActivityIndicator size="large" color="#0F766E" />}
            </View>
          }
          ListEmptyComponent={!cargando ? <Text style={styles.subtitle}>{error ? 'No hay datos disponibles. Pulsa Recargar para reintentar.' : 'Todavía no hay sneakers. Crea la primera con el formulario.'}</Text> : undefined}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.itemTitle}>{item.marca} {item.modelo}</Text>
              <Text style={styles.details}>Talla {item.talla} · {Number(item.precio).toFixed(2)} €</Text>
              <Text style={[styles.stock, item.stock === 0 && styles.soldOut]}>{item.stock === 0 ? 'AGOTADO' : `Stock: ${item.stock} unidades`}</Text>
              <Button title="Editar" onPress={() => { void editar(item.id); }} disabled={desactivado} color="#0F766E" />
              <View style={styles.spacing}><Button title="Eliminar" onPress={() => confirmar(item)} disabled={desactivado} color="#B91C1C" /></View>
            </View>
          )}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0FDFA' },
  flex: { flex: 1 },
  content: { padding: 24, paddingBottom: 48 },
  title: { fontSize: 30, fontWeight: '800', color: '#134E4A' },
  subtitle: { color: '#64748B', marginTop: 8, marginBottom: 20 },
  formTitle: { fontSize: 21, fontWeight: '800', color: '#134E4A', marginTop: 16, marginBottom: 16 },
  label: { color: '#134E4A', fontWeight: '600', marginBottom: 6 },
  input: { backgroundColor: '#FFF', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#99F6E4', color: '#0F172A', marginBottom: 14 },
  spacing: { marginTop: 10 },
  card: { backgroundColor: '#FFF', padding: 20, borderRadius: 18, marginBottom: 16 },
  itemTitle: { fontSize: 21, fontWeight: '800', color: '#134E4A' },
  details: { color: '#64748B', marginTop: 8 },
  stock: { color: '#0F766E', fontWeight: '800', marginVertical: 16 },
  soldOut: { color: '#B91C1C' },
  success: { color: '#166534', marginTop: 14 },
  error: { color: '#B91C1C', marginTop: 14 },
});
