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
exports.PaymentsController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const payments_service_1 = require("./payments.service");
const payment_dto_1 = require("./dto/payment.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
let PaymentsController = class PaymentsController {
    paymentsService;
    constructor(paymentsService) {
        this.paymentsService = paymentsService;
    }
    handleAbaWebhook(body) {
        return this.paymentsService.handleAbaWebhook(body);
    }
    handleKhqrWebhook(body, headers) {
        return this.paymentsService.handleKhqrWebhook(body, headers);
    }
    getAllPayments(query, req) {
        return this.paymentsService.getAllPayments(query, req.user);
    }
    getPaymentById(id, req) {
        return this.paymentsService.getPaymentById(BigInt(id), req.user);
    }
    createPayment(dto, req) {
        return this.paymentsService.createPayment(dto, req.user);
    }
    updatePayment(id, dto) {
        return this.paymentsService.updatePayment(BigInt(id), dto);
    }
    createAbaCheckout(dto, req) {
        return this.paymentsService.createAbaCheckout(dto, req.user);
    }
    generateKhqr(dto, req) {
        return this.paymentsService.generateKhqr(dto, req.user);
    }
    completePayment(dto, req) {
        return this.paymentsService.completePayment(dto, req.user);
    }
    confirmCashReceived(dto, req) {
        return this.paymentsService.confirmCashReceived(dto, req.user);
    }
    createWingCheckout(dto, req) {
        return this.paymentsService.createWingCheckout(dto, req.user);
    }
    handleWingWebhook(body) {
        return this.paymentsService.handleWingWebhook(body);
    }
    checkWingStatus(id) {
        return this.paymentsService.checkWingStatus(BigInt(id));
    }
};
exports.PaymentsController = PaymentsController;
__decorate([
    (0, common_1.Post)('webhook/aba'),
    (0, swagger_1.ApiOperation)({ summary: 'ABA PayWay Webhook' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Webhook processed successfully.' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "handleAbaWebhook", null);
__decorate([
    (0, common_1.Post)('webhook/khqr'),
    (0, swagger_1.ApiOperation)({ summary: 'KHQR Webhook' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'KHQR webhook processed successfully.',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "handleKhqrWebhook", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all payments' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Return all payments.' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "getAllPayments", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get payment by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Return payment details.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Payment not found.' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "getPaymentById", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new payment record' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'The payment has been successfully created.',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [payment_dto_1.CreatePaymentDto, Object]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "createPayment", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update a payment (Admin only)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'The payment has been successfully updated.',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, payment_dto_1.UpdatePaymentDto]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "updatePayment", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('aba/checkout'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create ABA PayWay Checkout' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'ABA checkout generated successfully.',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [payment_dto_1.CheckoutSessionDto, Object]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "createAbaCheckout", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('khqr/generate'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Generate KHQR for Booking' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'KHQR string generated successfully.',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [payment_dto_1.CheckoutSessionDto, Object]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "generateKhqr", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('complete'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Complete a non-gateway payment (e.g., cash request)',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Payment successfully completed or set to pending verification.',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [payment_dto_1.CompletePaymentDto, Object]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "completePayment", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'company_admin', 'staff'),
    (0, common_1.Post)('cash/confirm'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Confirm cash receipt (Staff/Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Cash payment confirmed.' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [payment_dto_1.ConfirmCashDto, Object]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "confirmCashReceived", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('wing/checkout'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create Wing Bank KHQR Checkout' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Wing checkout generated successfully.' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [payment_dto_1.CheckoutSessionDto, Object]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "createWingCheckout", null);
__decorate([
    (0, common_1.Post)('webhook/wing'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Wing Bank KHQR Webhook Callback' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Webhook processed successfully.' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "handleWingWebhook", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)(':id/wing-status'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Check status of Wing KHQR Payment' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns current payment status.' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "checkWingStatus", null);
exports.PaymentsController = PaymentsController = __decorate([
    (0, swagger_1.ApiTags)('Payments'),
    (0, common_1.Controller)('payments'),
    __metadata("design:paramtypes", [payments_service_1.PaymentsService])
], PaymentsController);
//# sourceMappingURL=payments.controller.js.map