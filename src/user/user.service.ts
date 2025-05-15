// src/user/user.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cache } from 'cache-manager';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { winstonLogger } from 'src/logger';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @Inject(CACHE_MANAGER)
    private readonly cache: Cache,
  ) {}

  async findById(id: number) {
    const key = `user:${id}`;
    const cachedRaw = await this.cache.get<string>(key);

    if (cachedRaw) {
      const cached = JSON.parse(cachedRaw);
      winstonLogger.info(`[CACHE HIT] ${key}`, { key, type: 'HIT', userId: id });
      return cached;
    }

    winstonLogger.info(`[CACHE MISS] ${key}`, { key, type: 'MISS', userId: id });

    const user = await this.userRepo.findOneBy({ id });

    if (user) {
      await this.cache.set(key, JSON.stringify(user), 60 * 1000);
      winstonLogger.info(`[CACHE SET] ${key}`, { key, type: 'SET', userId: id });
    }

    return user;
  }

  async create(name: string, email: string) {
    const user = this.userRepo.create({ name, email });
    const saved = await this.userRepo.save(user);
    const key = `user:${saved.id}`;

    await this.cache.set(key, JSON.stringify(saved), 60 * 1000);

    winstonLogger.info(`[CACHE SET] ${key}`, {
      key,
      type: 'MISS',
      userId: saved.id,
    });

    return saved;
  }
}
