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
exports.ResolveDisputeDto = exports.RespondToDisputeDto = exports.CreateDisputeDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateDisputeDto {
    type;
    description;
    photos;
    static _OPENAPI_METADATA_FACTORY() {
        return { type: { required: true, type: () => String, enum: ['payment_issue', 'quality_issue', 'safety', 'other'] }, description: { required: true, type: () => String }, photos: { required: false, type: () => [String] } };
    }
}
exports.CreateDisputeDto = CreateDisputeDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'payment_issue',
        enum: ['payment_issue', 'quality_issue', 'safety', 'other'],
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['payment_issue', 'quality_issue', 'safety', 'other']),
    __metadata("design:type", String)
], CreateDisputeDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'The service was not completed as described.' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateDisputeDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateDisputeDto.prototype, "photos", void 0);
class RespondToDisputeDto {
    response;
    static _OPENAPI_METADATA_FACTORY() {
        return { response: { required: true, type: () => String } };
    }
}
exports.RespondToDisputeDto = RespondToDisputeDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'We apologize for the inconvenience...' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RespondToDisputeDto.prototype, "response", void 0);
class ResolveDisputeDto {
    decision;
    refundAmount;
    static _OPENAPI_METADATA_FACTORY() {
        return { decision: { required: true, type: () => String, enum: ['accept_claim', 'accept_company', 'mediation'] }, refundAmount: { required: false, type: () => Number } };
    }
}
exports.ResolveDisputeDto = ResolveDisputeDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'accept_claim',
        enum: ['accept_claim', 'accept_company', 'mediation'],
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['accept_claim', 'accept_company', 'mediation']),
    __metadata("design:type", String)
], ResolveDisputeDto.prototype, "decision", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 50.0 }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], ResolveDisputeDto.prototype, "refundAmount", void 0);
//# sourceMappingURL=dispute.dto.js.map