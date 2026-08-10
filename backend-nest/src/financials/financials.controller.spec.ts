import { Test, TestingModule } from '@nestjs/testing';
import { FinancialsController } from './financials.controller';
import { FinancialsService } from './financials.service';
import { PrismaService } from '../prisma/prisma.service';

describe('FinancialsController', () => {
  let controller: FinancialsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FinancialsController],
      providers: [
        { provide: FinancialsService, useValue: {} },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    controller = module.get<FinancialsController>(FinancialsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
