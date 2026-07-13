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
exports.ProcessPayoutDto = exports.PayoutRequestDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class PayoutRequestDto {
    amount;
    destinationBank;
    accountName;
    accountNumber;
    static _OPENAPI_METADATA_FACTORY() {
        return { amount: { required: true, type: () => Number, minimum: 10 }, destinationBank: { required: true, type: () => String }, accountName: { required: true, type: () => String }, accountNumber: { required: true, type: () => String } };
    }
}
exports.PayoutRequestDto = PayoutRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Amount to withdraw', example: 50.0 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(10),
    __metadata("design:type", Number)
], PayoutRequestDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Destination Bank Name', example: 'ABA Bank' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], PayoutRequestDto.prototype, "destinationBank", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Account Name', example: 'John Doe' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], PayoutRequestDto.prototype, "accountName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Account Number', example: '123456789' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], PayoutRequestDto.prototype, "accountNumber", void 0);
class ProcessPayoutDto {
    status;
    adminNotes;
    static _OPENAPI_METADATA_FACTORY() {
        return { status: { required: true, enum: ["rejected", "paid"] }, adminNotes: { required: false, type: () => String } };
    }
}
exports.ProcessPayoutDto = ProcessPayoutDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Status of the payout (paid or rejected)', example: 'paid' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ProcessPayoutDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Optional admin notes', example: 'Processed via ABA' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ProcessPayoutDto.prototype, "adminNotes", void 0);
//# sourceMappingURL=financials.dto.js.map