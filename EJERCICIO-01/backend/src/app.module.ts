// app.module.ts
// RESPONSABILIDAD:
// Configurar la aplicación raíz y la conexión general con PostgreSQL.

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VideojuegosModule } from './videojuegos/videojuegos.module';

@Module({
  imports: [
    // forRoot() configura UNA conexión PostgreSQL para la aplicación.
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'postgres',
      database: 'databridge_e01',

      // Las Entities registradas en los módulos se cargarán automáticamente.
      autoLoadEntities: true,

      // Útil en este cuaderno local: crea/adapta tablas desde las Entities.
      // En producción se suelen utilizar migraciones.
      synchronize: true,
    }),

    // Importamos nuestro módulo funcional de videojuegos.
    VideojuegosModule,
  ],
})
export class AppModule {}