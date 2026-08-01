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
exports.CancelBookingDto = exports.UpdateProgressDto = exports.AssignStaffDto = exports.UpdateBookingStatusDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class UpdateBookingStatusDto {
    status;
    static _OPENAPI_METADATA_FACTORY() {
        return { status: { required: true, type: () => String } };
    }
}
exports.UpdateBookingStatusDto = UpdateBookingStatusDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpdateBookingStatusDto.prototype, "status", void 0);
class AssignStaffDto {
    staffId;
    static _OPENAPI_METADATA_FACTORY() {
        return { staffId: { required: true, type: () => String } };
    }
}
exports.AssignStaffDto = AssignStaffDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AssignStaffDto.prototype, "staffId", void 0);
class UpdateProgressDto {
    progressPercent;
    staffNotes;
    checklist;
    static _OPENAPI_METADATA_FACTORY() {
        return { progressPercent: { required: true, type: () => Number }, staffNotes: { required: false, type: () => String }, checklist: { required: false, type: () => Object } };
    }
}
exports.UpdateProgressDto = UpdateProgressDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Number)
], UpdateProgressDto.prototype, "progressPercent", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateProgressDto.prototype, "staffNotes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], UpdateProgressDto.prototype, "checklist", void 0);
class CancelBookingDto {
    reason;
    static _OPENAPI_METADATA_FACTORY() {
        return { reason: { required: false, type: () => String } };
    }
}
exports.CancelBookingDto = CancelBookingDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CancelBookingDto.prototype, "reason", void 0);
//# sourceMappingURL=booking-actions.dto.js.map