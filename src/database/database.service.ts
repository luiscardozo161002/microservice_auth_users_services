import { Injectable, OnModuleInit } from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private dataSource: DataSource;

  constructor() {

    // Inicializa el DataSource con la configuración
    this.dataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE, // Usamos la base de datos desde las variables de entorno
      synchronize: true,  // Habilitar sincronización para crear las tablas
      logging: true,  // Si lo necesitas para ver logs de SQL
    });
  }

  async onModuleInit() {
    try {
      // Verificar si la base de datos existe
      const dbExists = await this.checkDatabaseExistence();

      if (!dbExists) {
        console.log('La base de datos no existe. Creando base de datos...');
        await this.createDatabase();
        console.log('Base de datos creada con éxito.');
      } else {
        console.log('La base de datos ya existe.');
      }

      // Inicializar la conexión a la base de datos
      await this.dataSource.initialize();
      console.log('Conexión exitosa a la base de datos.');
      
    } catch (error) {
      console.error('Error al conectar o crear la base de datos:', error);
    }
  }

  // Método para verificar si la base de datos existe
  private async checkDatabaseExistence(): Promise<boolean> {
    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();
    try {
      const result = await queryRunner.query(
        `SELECT 1 FROM pg_database WHERE datname = $1`,
        [process.env.DB_DATABASE]
      );
      return result.length > 0;
    } catch (error) {
      console.error('Error al verificar la base de datos:', error);
      return false;
    } finally {
      await queryRunner.release();
    }
  }

  // Método para crear la base de datos
  private async createDatabase(): Promise<void> {
    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();
    try {
      await queryRunner.query(
        `CREATE DATABASE "${process.env.DB_DATABASE}"`
      );
    } catch (error) {
      console.error('Error al crear la base de datos:', error);
    } finally {
      await queryRunner.release();
    }
  }
}
