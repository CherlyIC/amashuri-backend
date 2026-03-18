import { Test, TestingModule } from '@nestjs/testing';
import { CombinationsController } from './combinations.controller';

describe('CombinationsController', () => {
  let controller: CombinationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CombinationsController],
    }).compile();

    controller = module.get<CombinationsController>(CombinationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
