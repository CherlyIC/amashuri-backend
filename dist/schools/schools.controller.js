"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchoolsController = void 0;
const common_1 = require("@nestjs/common");
const schools_service_1 = require("./schools.service");
const create_school_dto_1 = require("./dto/create-school.dto");
const update_school_dto_1 = require("./dto/update-school.dto");
const filter_school_dto_1 = require("./dto/filter-school.dto");
const roles_decorator_1 = require("../auth/roles.decorator");
const public_decorator_1 = require("../auth/public.decorator");
let SchoolsController = class SchoolsController {
    schoolsService;
    constructor(schoolsService) {
        this.schoolsService = schoolsService;
    }
    create(createSchoolDto) {
        return this.schoolsService.create(createSchoolDto);
    }
    findAll(filterDto) {
        return this.schoolsService.findAll(filterDto);
    }
    findNearby(lat, lng, radius) {
        return this.schoolsService.findNearby(Number(lat), Number(lng), Number(radius));
    }
    findOne(id) {
        return this.schoolsService.findOne(id);
    }
    update(id, updateSchoolDto) {
        return this.schoolsService.update(id, updateSchoolDto);
    }
    remove(id) {
        return this.schoolsService.remove(id);
    }
    submitForVerification(id) {
        return this.schoolsService.submitForVerification(id);
    }
};
exports.SchoolsController = SchoolsController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(roles_decorator_1.Role.ADMIN),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_school_dto_1.CreateSchoolDto]),
    __metadata("design:returntype", void 0)
], SchoolsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [filter_school_dto_1.FilterSchoolDto]),
    __metadata("design:returntype", void 0)
], SchoolsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('nearby'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Query)('lat')),
    __param(1, (0, common_1.Query)('lng')),
    __param(2, (0, common_1.Query)('radius')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number]),
    __metadata("design:returntype", void 0)
], SchoolsController.prototype, "findNearby", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SchoolsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.Role.ADMIN, roles_decorator_1.Role.SCHOOL_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_school_dto_1.UpdateSchoolDto]),
    __metadata("design:returntype", void 0)
], SchoolsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SchoolsController.prototype, "remove", null);
__decorate([
    (0, common_1.Put)(':id/submit'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.Role.ADMIN, roles_decorator_1.Role.SCHOOL_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SchoolsController.prototype, "submitForVerification", null);
exports.SchoolsController = SchoolsController = __decorate([
    (0, common_1.Controller)('schools'),
    __metadata("design:paramtypes", [schools_service_1.SchoolsService])
], SchoolsController);
//# sourceMappingURL=schools.controller.js.map