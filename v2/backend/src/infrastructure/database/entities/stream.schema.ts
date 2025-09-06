import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { UserEntity } from './user.schema';

@Entity('streams')
export class StreamEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'owner_id', type: 'uuid' })
  @Index()
  ownerId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner: UserEntity;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'thumbnail_url', type: 'text', nullable: true })
  thumbnailUrl: string;

  @Column({ name: 'stream_key', length: 100, unique: true, nullable: true })
  streamKey: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'waiting',
  })
  @Index()
  status: string;

  @Column({ name: 'viewer_count', default: 0 })
  viewerCount: number;

  @Column({ name: 'max_viewers', default: 0 })
  maxViewers: number;

  @Column({ name: 'allow_comments', default: true })
  allowComments: boolean;

  @Column({ name: 'comment_cooldown', default: 1000 })
  commentCooldown: number;

  @Column({ name: 'max_comment_length', default: 200 })
  maxCommentLength: number;

  @Column({ name: 'allow_anonymous', default: false })
  allowAnonymous: boolean;

  @Column({ name: 'started_at', type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ name: 'ended_at', type: 'timestamp', nullable: true })
  endedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  @Index()
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}