import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cache } from 'cache-manager';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @Inject(CACHE_MANAGER)
    private readonly cache: Cache,
  ) {}

  async findById(id: number) {
    const key = `user:${id}`;
    const cached = await this.cache.get(key);
    if (cached) {
      this.logger.log(`[CACHE HIT] ${key}`);
      return cached;
    }
    this.logger.log(`[CACHE MISS] ${key}`);
    const user = await this.userRepo.findOneBy({ id });
    if (user) await this.cache.set(key, user, 600); // TTL 10분
    return user;
  }

  async create(name: string, email: string) {
    const user = this.userRepo.create({ name, email });
    const saved = await this.userRepo.save(user);
    const key = `user:${saved.id}`;
    await this.cache.set(key, saved, 600); // 생성 후 바로 캐싱
    this.logger.log(`[CACHE SET] ${key}`);
    return saved;
  }
}
