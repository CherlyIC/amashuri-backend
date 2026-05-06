import { Module } from '@nestjs/common';
import { SchoolAdminController } from './school-admin.controller';
import { SchoolAdminService } from './school-admin.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SchoolAdminController],
  providers: [SchoolAdminService],
  exports: [SchoolAdminService],
})
export class SchoolAdminModule {}
