import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SchoolsModule } from './schools/schools.module';
import { FeesModule } from './fees/fees.module';
import { CombinationsModule } from './combinations/combinations.module';
import { ResourcesModule } from './resources/resources.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { ReviewsModule } from './reviews/reviews.module';
import { FavouritesModule } from './favourites/favourites.module';
import { CompareModule } from './compare/compare.module';
import { EnquiriesModule } from './enquiries/enquiries.module';
import { AdminModule } from './admin/admin.module';
import { RecommendationsModule } from './recommendations/recommendations.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    SchoolsModule,
    FeesModule,
    CombinationsModule,
    ResourcesModule,
    ReviewsModule,
    FavouritesModule,
    CompareModule,
    EnquiriesModule,
    AdminModule,
    RecommendationsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}