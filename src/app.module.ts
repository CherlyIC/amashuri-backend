import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SchoolsModule } from './schools/schools.module';
import { FeesModule } from './fees/fees.module';
import { CombinationsModule } from './combinations/combinations.module';
import { ResourcesModule } from './resources/resources.module';
import { ReviewsModule } from './reviews/reviews.module';
import { FavouritesModule } from './favourites/favourites.module';
import { CompareModule } from './compare/compare.module';
import { EnquiriesModule } from './enquiries/enquiries.module';
import { RecommendationsModule } from './recommendations/recommendations.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [AuthModule, UsersModule, SchoolsModule, FeesModule, CombinationsModule, ResourcesModule, ReviewsModule, FavouritesModule, CompareModule, EnquiriesModule, RecommendationsModule, AdminModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
