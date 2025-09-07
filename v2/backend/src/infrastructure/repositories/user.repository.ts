import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../domain/entities/user.entity';
import { IUserRepository, UserFilter } from '../../domain/repositories/user.repository.interface';
import { UserEntity } from '../database/entities/user.schema';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repository: Repository<UserEntity>,
  ) {}

  async findById(id: string): Promise<User | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const entity = await this.repository.findOne({ where: { email } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const entity = await this.repository.findOne({ where: { username } });
    return entity ? this.toDomain(entity) : null;
  }

  async save(user: User): Promise<User> {
    const entity = this.toEntity(user);
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async update(user: User): Promise<User> {
    const entity = this.toEntity(user);
    const updated = await this.repository.save(entity);
    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async exists(email: string): Promise<boolean> {
    const count = await this.repository.count({ where: { email } });
    return count > 0;
  }

  async existsByUsername(username: string): Promise<boolean> {
    const count = await this.repository.count({ where: { username } });
    return count > 0;
  }

  async findAll(filter?: UserFilter): Promise<User[]> {
    const where: any = {};
    let take = undefined;
    let skip = undefined;
    
    if (filter) {
      if (filter.level !== undefined) {
        where.level = filter.level;
      }
      if (filter.minLevel !== undefined) {
        where.level = { $gte: filter.minLevel };
      }
      if (filter.search) {
        where.username = { $like: `%${filter.search}%` };
      }
      if (filter.isActive !== undefined) {
        // Consider users active if they logged in within last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        if (filter.isActive) {
          where.lastLoginAt = { $gte: thirtyDaysAgo };
        }
      }
    }
    
    const entities = await this.repository.find({
      where,
      take,
      skip,
      order: { createdAt: 'DESC' },
    });
    return entities.map(entity => this.toDomain(entity));
  }

  async findByRefreshToken(refreshToken: string): Promise<User | null> {
    const entity = await this.repository.findOne({ 
      where: { refreshToken } as any 
    });
    return entity ? this.toDomain(entity) : null;
  }

  async updateRefreshToken(userId: string, refreshToken: string | null): Promise<void> {
    await this.repository.update(userId, { refreshToken } as any);
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.repository.update(userId, { 
      lastLoginAt: new Date() 
    } as any);
  }

  async updateLevel(userId: string, level: number): Promise<void> {
    await this.repository.update(userId, { level });
  }

  async incrementExp(userId: string, amount: number): Promise<void> {
    await this.repository.increment({ id: userId }, 'exp' as any, amount);
  }

  async updateAvatar(userId: string, avatarUrl: string): Promise<void> {
    await this.repository.update(userId, { avatarUrl });
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await this.repository.update(userId, { passwordHash });
  }

  async countUsers(): Promise<number> {
    return await this.repository.count();
  }

  async searchUsers(searchTerm: string, limit?: number): Promise<User[]> {
    const query = this.repository.createQueryBuilder('user')
      .where('user.username ILIKE :search OR user.email ILIKE :search', {
        search: `%${searchTerm}%`
      })
      .orderBy('user.username', 'ASC');
    
    if (limit) {
      query.limit(limit);
    }
    
    const entities = await query.getMany();
    return entities.map(entity => this.toDomain(entity));
  }

  async findActiveUsers(days: number, limit?: number): Promise<User[]> {
    const date = new Date();
    date.setDate(date.getDate() - days);
    
    const query = this.repository.createQueryBuilder('user')
      .where('user.lastLoginAt >= :date', { date })
      .orderBy('user.lastLoginAt', 'DESC');
    
    if (limit) {
      query.limit(limit);
    }
    
    const entities = await query.getMany();
    return entities.map(entity => this.toDomain(entity));
  }

  async getUserStats(userId: string): Promise<any> {
    const user = await this.repository.findOne({ where: { id: userId } });
    if (!user) return null;
    
    return {
      level: user.level,
      exp: (user as any).exp || 0,
      joinedAt: user.createdAt,
      lastLoginAt: (user as any).lastLoginAt || user.updatedAt,
    };
  }

  async updateExperience(id: string, exp: number): Promise<void> {
    await this.repository.update(id, { exp } as any);
  }

  async getTopUsers(limit: number): Promise<User[]> {
    const entities = await this.repository.find({
      order: { level: 'DESC' },
      take: limit,
    });
    return entities.map(entity => this.toDomain(entity));
  }

  async updateWatchTime(id: string, seconds: number): Promise<void> {
    await this.repository.query(
      `UPDATE user_entity SET watch_time = watch_time + $1 WHERE id = $2`,
      [seconds, id]
    );
  }

  async incrementStreamCount(id: string): Promise<void> {
    await this.repository.query(
      `UPDATE user_entity SET stream_count = COALESCE(stream_count, 0) + 1 WHERE id = $1`,
      [id]
    );
  }

  async getStatsByTimeRange(startDate: Date, endDate: Date): Promise<any> {
    const result = await this.repository.createQueryBuilder('user')
      .where('user.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .getCount();
    
    return {
      newUsers: result,
      startDate,
      endDate,
    };
  }

  async findOnlineUsers(): Promise<User[]> {
    // Consider users online if they were active in last 5 minutes
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
    
    const entities = await this.repository.find({
      where: {
        updatedAt: { $gte: fiveMinutesAgo } as any,
      },
    });
    return entities.map(entity => this.toDomain(entity));
  }

  async incrementCommentCount(id: string): Promise<void> {
    await this.repository.query(
      `UPDATE user_entity SET comment_count = COALESCE(comment_count, 0) + 1 WHERE id = $1`,
      [id]
    );
  }

  async verifyEmail(id: string): Promise<void> {
    await this.repository.update(id, {
      emailVerified: true,
    } as any);
  }

  private toDomain(entity: UserEntity): User {
    return new User(
      entity.id,
      entity.username,
      entity.email,
      entity.passwordHash,
      entity.avatarUrl,
      entity.level,
      entity.createdAt,
      entity.updatedAt,
    );
  }

  private toEntity(domain: User): UserEntity {
    const entity = new UserEntity();
    if (domain.id) entity.id = domain.id;
    entity.username = domain.username;
    entity.email = domain.email;
    entity.passwordHash = domain.passwordHash;
    entity.avatarUrl = domain.avatarUrl || '';
    entity.level = domain.level;
    entity.createdAt = domain.createdAt;
    entity.updatedAt = domain.updatedAt;
    return entity;
  }
}