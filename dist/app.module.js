"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const schools_module_1 = require("./schools/schools.module");
const fees_module_1 = require("./fees/fees.module");
const combinations_module_1 = require("./combinations/combinations.module");
const resources_module_1 = require("./resources/resources.module");
const reviews_module_1 = require("./reviews/reviews.module");
const favourites_module_1 = require("./favourites/favourites.module");
const compare_module_1 = require("./compare/compare.module");
const enquiries_module_1 = require("./enquiries/enquiries.module");
const recommendations_module_1 = require("./recommendations/recommendations.module");
const admin_module_1 = require("./admin/admin.module");
const prisma_module_1 = require("./prisma/prisma.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_1.AuthModule, users_module_1.UsersModule, schools_module_1.SchoolsModule, fees_module_1.FeesModule, combinations_module_1.CombinationsModule, resources_module_1.ResourcesModule, reviews_module_1.ReviewsModule, favourites_module_1.FavouritesModule, compare_module_1.CompareModule, enquiries_module_1.EnquiriesModule, recommendations_module_1.RecommendationsModule, admin_module_1.AdminModule, prisma_module_1.PrismaModule],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map