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
exports.GenerateAvailabilityDto = exports.AddAvailabilityDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class AddAvailabilityDto {
    date;
    startTime;
    endTime;
    isAvailable;
    static _OPENAPI_METADATA_FACTORY() {
        return { date: { required: true, type: () => String }, startTime: { required: true, type: () => String }, endTime: { required: true, type: () => String }, isAvailable: { required: false, type: () => Boolean } };
    }
}
exports.AddAvailabilityDto = AddAvailabilityDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Date of availability', example: '2026-07-01' }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AddAvailabilityDto.prototype, "date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Start time',
        example: '1970-01-01T09:00:00.000Z',
    }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AddAvailabilityDto.prototype, "startTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'End time', example: '1970-01-01T17:00:00.000Z' }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AddAvailabilityDto.prototype, "endTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Is the staff available on this date?',
        default: true,
    }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], AddAvailabilityDto.prototype, "isAvailable", void 0);
class GenerateAvailabilityDto {
    startDate;
    endDate;
    startTime;
    endTime;
    daysOff;
    static _OPENAPI_METADATA_FACTORY() {
        return { startDate: { required: true, type: () => String }, endDate: { required: true, type: () => String }, startTime: { required: true, type: () => String }, endTime: { required: true, type: () => String }, daysOff: { required: false, type: () => [Number] } };
    }
}
exports.GenerateAvailabilityDto = GenerateAvailabilityDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Start date', example: '2026-07-01' }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], GenerateAvailabilityDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'End date', example: '2026-07-31' }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], GenerateAvailabilityDto.prototype, "endDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Start time each day',
        example: '1970-01-01T09:00:00.000Z',
    }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], GenerateAvailabilityDto.prototype, "startTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'End time each day',
        example: '1970-01-01T17:00:00.000Z',
    }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], GenerateAvailabilityDto.prototype, "endTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Array of days to skip (0=Sun, 1=Mon, etc.)',
        example: [0, 6],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsNumber)({}, { each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], GenerateAvailabilityDto.prototype, "daysOff", void 0);
//# sourceMappingURL=availability.dto.js.map