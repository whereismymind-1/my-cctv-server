import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { StreamEntity } from './stream.schema';
import { UserEntity } from './user.schema';

@Entity('comments')
export class CommentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'stream_id', type: 'uuid' })
  @Index()
  streamId: string;

  @ManyToOne(() => StreamEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'stream_id' })
  stream: StreamEntity;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  @Index()
  userId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ length: 200 })
  text: string;

  @Column({ length: 50, nullable: true })
  command: string;

  @Column({ nullable: true })
  vpos: number; // Video position in milliseconds

  @CreateDateColumn({ name: 'created_at' })
  @Index()
  createdAt: Date;
}