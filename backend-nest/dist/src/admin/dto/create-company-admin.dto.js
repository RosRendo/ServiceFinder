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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateCompanyAdminDto = exports.InitialServiceDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class InitialServiceDto {
    name;
    typeId;
    basePrice;
    durationMin;
    description;
    imageUrl;
    checklist;
    static _OPENAPI_METADATA_FACTORY() {
        return { name: { required: true, type: () => String }, typeId: { required: true, type: () => Number }, basePrice: { required: false, type: () => Number }, durationMin: { required: false, type: () => Number }, description: { required: false, type: () => String }, imageUrl: { required: false, type: () => String }, checklist: { required: false, type: () => [String] } };
    }
}
exports.InitialServiceDto = InitialServiceDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], InitialServiceDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], InitialServiceDto.prototype, "typeId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], InitialServiceDto.prototype, "basePrice", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], InitialServiceDto.prototype, "durationMin", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], InitialServiceDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], InitialServiceDto.prototype, "imageUrl", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], InitialServiceDto.prototype, "checklist", void 0);
class CreateCompanyAdminDto {
    ownerName;
    ownerEmail;
    ownerPassword;
    ownerPhone;
    companyName;
    companyDescription;
    companyAddress;
    companyCity;
    companyPhone;
    companyEmail;
    logoUrl;
    registrationNumber;
    latitude;
    longitude;
    coverImageUrl;
    verificationDocumentUrl;
    establishedYear;
    cardHighlights;
    detailHighlights;
    serviceName;
    serviceTypeId;
    serviceBasePrice;
    serviceDurationMin;
    serviceDescription;
    email;
    description;
    isInsured;
    coverageRadiusKm;
    services;
    static _OPENAPI_METADATA_FACTORY() {
        return { ownerName: { required: true, type: () => String }, ownerEmail: { required: true, type: () => String, format: "email" }, ownerPassword: { required: true, type: () => String, minLength: 6 }, ownerPhone: { required: false, type: () => String }, companyName: { required: true, type: () => String }, companyDescription: { required: false, type: () => String }, companyAddress: { required: false, type: () => String }, companyCity: { required: false, type: () => String }, companyPhone: { required: false, type: () => String }, companyEmail: { required: false, type: () => String }, logoUrl: { required: false, type: () => String }, registrationNumber: { required: false, type: () => String }, latitude: { required: false, type: () => Number }, longitude: { required: false, type: () => Number }, coverImageUrl: { required: false, type: () => String }, verificationDocumentUrl: { required: false, type: () => String }, establishedYear: { required: false, type: () => Number }, cardHighlights: { required: false, type: () => [String] }, detailHighlights: { required: false, type: () => [String] }, serviceName: { required: false, type: () => String }, serviceTypeId: { required: false, type: () => Number }, serviceBasePrice: { required: false, type: () => Number }, serviceDurationMin: { required: false, type: () => Number }, serviceDescription: { required: false, type: () => String }, email: { required: false, type: () => String }, description: { required: false, type: () => String }, isInsured: { required: false, type: () => Boolean }, coverageRadiusKm: { required: false, type: () => Number }, services: { required: false, type: () => [require("./create-company-admin.dto").InitialServiceDto] } };
    }
}
exports.CreateCompanyAdminDto = CreateCompanyAdminDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateCompanyAdminDto.prototype, "ownerName", void 0);
__decorate([
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateCompanyAdminDto.prototype, "ownerEmail", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(6, { message: 'Password must be at least 6 characters long' }),
    __metadata("design:type", String)
], CreateCompanyAdminDto.prototype, "ownerPassword", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCompanyAdminDto.prototype, "ownerPhone", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateCompanyAdminDto.prototype, "companyName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCompanyAdminDto.prototype, "companyDescription", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCompanyAdminDto.prototype, "companyAddress", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCompanyAdminDto.prototype, "companyCity", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCompanyAdminDto.prototype, "companyPhone", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCompanyAdminDto.prototype, "companyEmail", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCompanyAdminDto.prototype, "logoUrl", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCompanyAdminDto.prototype, "registrationNumber", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateCompanyAdminDto.prototype, "latitude", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateCompanyAdminDto.prototype, "longitude", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCompanyAdminDto.prototype, "coverImageUrl", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCompanyAdminDto.prototype, "verificationDocumentUrl", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateCompanyAdminDto.prototype, "establishedYear", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateCompanyAdminDto.prototype, "cardHighlights", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateCompanyAdminDto.prototype, "detailHighlights", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCompanyAdminDto.prototype, "serviceName", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateCompanyAdminDto.prototype, "serviceTypeId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateCompanyAdminDto.prototype, "serviceBasePrice", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateCompanyAdminDto.prototype, "serviceDurationMin", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCompanyAdminDto.prototype, "serviceDescription", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCompanyAdminDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCompanyAdminDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateCompanyAdminDto.prototype, "isInsured", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateCompanyAdminDto.prototype, "coverageRadiusKm", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => InitialServiceDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateCompanyAdminDto.prototype, "services", void 0);
//# sourceMappingURL=create-company-admin.dto.js.map