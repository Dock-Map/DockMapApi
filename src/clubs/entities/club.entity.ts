import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { ShipType } from 'src/shared/types/ship';
import { ClubParkingLocation } from 'src/shared/types/clubs';
import { Tariff } from './tariff.entity';
import { Service } from './service.entity';

@Entity()
export class Club {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  address: string;

  @Column()
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  pricePerMonth: number;

  @Column({ nullable: true })
  pricePerYear: number;

  @Column({ nullable: true })
  pricePerDay: number;

  @Column({ type: 'enum', enum: ShipType, array: true, nullable: true })
  shipType: ShipType[];

  @Column({ type: 'enum', enum: ClubParkingLocation, array: true, nullable: true })
  parkingLocations: ClubParkingLocation[];

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ default: 0 })
  totalSpots: number;

  @Column({ default: 0 })
  availableSpots: number;

  @Column({ type: 'simple-array', nullable: true })
  features: string[];

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude: number;

  @ManyToOne(() => User, (user) => user.ownersClubs, { nullable: false, eager: false })
  @JoinColumn({ name: 'userId' })
  owner: User;

  @Column({ name: 'userId' })
  userId: string;

  @OneToMany(() => Tariff, (tariff) => tariff.club, { cascade: true, eager: false })
  tariffs: Tariff[];

  @OneToMany(() => Service, (service) => service.club, { cascade: true, eager: false })
  services: Service[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
