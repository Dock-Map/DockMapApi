import { UserRole } from 'src/shared/types/user.role';
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum AuthProvider {
  SMS = 'sms',
  TELEGRAM = 'telegram',
  VK = 'vk',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  email: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.SHIPOWNER,
  })
  role: UserRole;

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

  @Column({ default: false })
  isPhoneVerified: boolean;

  @Column({ nullable: true })
  refreshTokenHash?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
