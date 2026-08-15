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
exports.ConfirmCashDto = exports.CompletePaymentDto = exports.CheckoutSessionDto = exports.UpdatePaymentDto = exports.CreatePaymentDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreatePaymentDto {
    bookingId;
    method;
    transactionRef;
    static _OPENAPI_METADATA_FACTORY() {
        return { bookingId: { required: true, type: () => String }, method: { required: true, type: () => String, enum: ['card', 'cash', 'bank', 'wallet'] }, transactionRef: { required: false, type: () => String } };
    }
}
exports.CreatePaymentDto = CreatePaymentDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreatePaymentDto.prototype, "bookingId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsIn)(['card', 'cash', 'bank', 'wallet']),
    __metadata("design:type", String)
], CreatePaymentDto.prototype, "method", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreatePaymentDto.prototype, "transactionRef", void 0);
class UpdatePaymentDto {
    status;
    transactionRef;
    static _OPENAPI_METADATA_FACTORY() {
        return { status: { required: true, type: () => String }, transactionRef: { required: false, type: () => String } };
    }
}
exports.UpdatePaymentDto = UpdatePaymentDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpdatePaymentDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdatePaymentDto.prototype, "transactionRef", void 0);
class CheckoutSessionDto {
    bookingId;
    type;
    static _OPENAPI_METADATA_FACTORY() {
        return { bookingId: { required: true, type: () => String }, type: { required: false, enum: ["khqr", "deeplink"], enum: ['khqr', 'deeplink'] } };
    }
}
exports.CheckoutSessionDto = CheckoutSessionDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CheckoutSessionDto.prototype, "bookingId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['khqr', 'deeplink']),
    __metadata("design:type", String)
], CheckoutSessionDto.prototype, "type", void 0);
class CompletePaymentDto {
    bookingId;
    method;
    static _OPENAPI_METADATA_FACTORY() {
        return { bookingId: { required: true, type: () => String }, method: { required: true, type: () => String, enum: ['cash', 'bank', 'wallet'] } };
    }
}
exports.CompletePaymentDto = CompletePaymentDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CompletePaymentDto.prototype, "bookingId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsIn)(['cash', 'bank', 'wallet']),
    __metadata("design:type", String)
], CompletePaymentDto.prototype, "method", void 0);
class ConfirmCashDto {
    bookingId;
    staffNotes;
    static _OPENAPI_METADATA_FACTORY() {
        return { bookingId: { required: true, type: () => String }, staffNotes: { required: false, type: () => String } };
    }
}
exports.ConfirmCashDto = ConfirmCashDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ConfirmCashDto.prototype, "bookingId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ConfirmCashDto.prototype, "staffNotes", void 0);
//# sourceMappingURL=payment.dto.js.map