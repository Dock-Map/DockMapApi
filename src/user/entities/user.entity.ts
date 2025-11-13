import { UserRole } from 'src/shared/types/user.role';
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Club } from 'src/clubs/entities/club.entity';

export enum AuthProvider {
  SMS = 'sms',
  TELEGRAM = 'telegram',
  VK = 'vk',
  EMAIL = 'email',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    nullable: true, // Роль может быть null для новых пользователей
  })
  role: UserRole;

  @Column()
  name: string;

  @Column({ unique: true })
  phone: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column({ nullable: true })
  telegramChatId: string;

  @Column({
    type: 'enum',
    enum: AuthProvider,
  })
  authProvider: AuthProvider;

  @Column({ nullable: true })
  providerId: string;

  @Column({ nullable: true })
  telegramUsername: string;

  @Column({ nullable: true })
  vkId: string;

  @Column({ nullable: true })
  cityId: number;

  @Column({ nullable: true })
  password: string;

  @Column({ default: false })
  isPhoneVerified: boolean;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ nullable: true })
  refreshTokenHash?: string;

  @Column({ nullable: true })
  lastLoginIp: string;

  @Column({ nullable: true })
  lastLoginAt: Date;

  @OneToMany(() => Club, (club) => club.owner)
  ownersClubs: Club[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
