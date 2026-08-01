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
exports.CreatePricingRuleDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class CreatePricingRuleDto {
    name;
    dayOfWeek;
    startHour;
    endHour;
    surchargePercent;
    isActive;
    static _OPENAPI_METADATA_FACTORY() {
        return { name: { required: true, type: () => String }, dayOfWeek: { required: false, type: () => Number, minimum: 0, maximum: 6 }, startHour: { required: false, type: () => Number, minimum: 0, maximum: 23 }, endHour: { required: false, type: () => Number, minimum: 0, maximum: 24 }, surchargePercent: { required: true, type: () => Number, minimum: 1, maximum: 100 }, isActive: { required: false, type: () => Boolean } };
    }
}
exports.CreatePricingRuleDto = CreatePricingRuleDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreatePricingRuleDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(6),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreatePricingRuleDto.prototype, "dayOfWeek", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(23),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreatePricingRuleDto.prototype, "startHour", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(24),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreatePricingRuleDto.prototype, "endHour", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreatePricingRuleDto.prototype, "surchargePercent", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreatePricingRuleDto.prototype, "isActive", void 0);
//# sourceMappingURL=create-pricing-rule.dto.js.map