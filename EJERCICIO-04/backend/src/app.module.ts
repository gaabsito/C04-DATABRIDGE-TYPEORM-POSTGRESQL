// app.module.ts
// Esta isla tiene su propia conexión y su propia base de datos.
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RestaurantesModule } from './restaurantes/restaurantes.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'postgres',
      database: 'databridge_e04',
      autoLoadEntities: true,
      synchronize: true,
    }),
    RestaurantesModule,
  ],
})
export class AppModule {}
