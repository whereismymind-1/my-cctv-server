import { Repository } from 'typeorm';
import { User } from '../../domain/entities/user.entity';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { UserEntity } from '../database/entities/user.schema';
export declare class UserRepository implements IUserRepository {
    private readonly repository;
    constructor(repository: Repository<UserEntity>);
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    findByUsername(username: string): Promise<User | null>;
    save(user: User): Promise<User>;
    update(user: User): Promise<User>;
    delete(id: string): Promise<void>;
    exists(email: string): Promise<boolean>;
    existsByUsername(username: string): Promise<boolean>;
    private toDomain;
    private toEntity;
}
