import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity()
export class VerificationCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  @Index()
  phoneNumber?: string;

  @Column({ nullable: true })
  @Index()
  email?: string;

  @Column()
  code: string;

  @Column({ default: false })
  isUsed: boolean;

  @Column()
  expiresAt: Date;

  @Column({
    type: 'enum',
    enum: ['SMS', 'EMAIL', 'PASSWORD_RESET'],
    default: 'SMS',
  })
  type: 'SMS' | 'EMAIL' | 'PASSWORD_RESET';

  @CreateDateColumn()
  createdAt: Date;
}
