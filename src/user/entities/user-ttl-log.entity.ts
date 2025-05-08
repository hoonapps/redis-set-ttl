import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class UserTtlLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  hit: number;

  @Column()
  miss: number;

  @Column()
  recommendedTtl: number;

  @CreateDateColumn()
  createdAt: Date;
}
