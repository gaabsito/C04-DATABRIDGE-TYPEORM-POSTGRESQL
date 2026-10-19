// App.tsx
// RESPONSABILIDAD:
// Pedir los videojuegos a NestJS y representarlos en React Native.

import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

// Este tipo describe el JSON que esperamos recibir de la API.
type Videojuego = {
  id: number;
  titulo: string;
  plataforma: string;
  genero: string;
  puntuacion: number | string;
};

// En móvil físico sustituye TU_IP_LOCAL por la IP del ordenador.
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export default function App() {
  const [videojuegos, setVideojuegos] = useState<Videojuego[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // Se ejecuta una vez al montar la pantalla.
  useEffect(() => {
    async function cargarVideojuegos() {
      try {
        // GET http://TU_IP_LOCAL:3000/videojuegos
        const respuesta = await fetch(API_URL + '/videojuegos');

        if (!respuesta.ok) {
          throw new Error('La API no ha respondido correctamente');
        }

        // Convertimos JSON → objetos TypeScript.
        const datos: Videojuego[] = await respuesta.json();

        // Cambiar el estado provoca un nuevo render.
        setVideojuegos(datos);
      } catch {
        setError(
          'No se ha podido conectar con NestJS. Revisa la IP y el puerto.',
        );
      } finally {
        setCargando(false);
      }
    }

    cargarVideojuegos();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <Text style={styles.eyebrow}>GAME VAULT</Text>
        <Text style={styles.title}>Mi colección</Text>
        <Text style={styles.subtitle}>
          Datos reales recuperados desde PostgreSQL
        </Text>
      </View>

      {cargando && (
        <ActivityIndicator size="large" style={styles.center} />
      )}

      {error !== '' && (
        <Text style={styles.error}>{error}</Text>
      )}

      {!cargando && error === '' && (
        <FlatList
          data={videojuegos}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.gameIcon}>
                <Text style={styles.gameEmoji}>🎮</Text>
              </View>

              <View style={styles.cardContent}>
                <Text style={styles.gameTitle}>{item.titulo}</Text>
                <Text style={styles.platform}>{item.genero} · {item.plataforma}</Text>
              </View>

              <View style={styles.score}>
                <Text style={styles.scoreText}>
                  ★ {Number(item.puntuacion).toFixed(1)}
                </Text>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 20,
  },
  eyebrow: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    marginTop: 4,
  },
  subtitle: {
    color: '#94A3B8',
    marginTop: 6,
  },
  list: {
    paddingHorizontal: 18,
    paddingBottom: 24,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },
  gameIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameEmoji: {
    fontSize: 24,
  },
  cardContent: {
    flex: 1,
    marginLeft: 14,
  },
  gameTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  platform: {
    color: '#94A3B8',
    marginTop: 4,
  },
  score: {
    backgroundColor: '#0F766E',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  scoreText: {
    color: '#CCFBF1',
    fontWeight: '800',
  },
  center: {
    marginTop: 80,
  },
  error: {
    color: '#FCA5A5',
    paddingHorizontal: 24,
    marginTop: 30,
    textAlign: 'center',
  },
});