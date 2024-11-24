import { Entity, PrimaryGeneratedColumn, Column, DeleteDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50, unique: true })
  username: string;

  @Column({ unique: true, nullable: false })
  email: string;

  @Column({ nullable: false }) // Agrega { select: false } si deseas ocultar la contraseña en las consultas.
  password: string;

  @Column({ default: 'user' })
  role: string;

  @Column({ nullable: true }) 
  firebaseUid: string;

  @Column({ default: true })
  isActive: boolean;

  @DeleteDateColumn()
  deleteAt: Date;
}
