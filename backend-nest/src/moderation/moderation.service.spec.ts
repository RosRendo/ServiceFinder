import { Test, TestingModule } from '@nestjs/testing';
import { ModerationService } from './moderation.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ModerationService', () => {
  let service: ModerationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ModerationService, { provide: PrismaService, useValue: {} }],
    }).compile();

    service = module.get<ModerationService>(ModerationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
