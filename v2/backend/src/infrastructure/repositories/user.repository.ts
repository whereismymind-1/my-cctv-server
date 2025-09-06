import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../domain/entities/user.entity';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
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
    entity.avatarUrl = domain.avatarUrl;
    entity.level = domain.level;
    entity.createdAt = domain.createdAt;
    entity.updatedAt = domain.updatedAt;
    return entity;
  }
}