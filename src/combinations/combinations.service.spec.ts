import { Test, TestingModule } from '@nestjs/testing';
import { CombinationsService } from './combinations.service';

describe('CombinationsService', () => {
  let service: CombinationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CombinationsService],
    }).compile();

    service = module.get<CombinationsService>(CombinationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
