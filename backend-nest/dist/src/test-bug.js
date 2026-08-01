"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const payouts_service_1 = require("./payouts/payouts.service");
BigInt.prototype.toJSON = function () {
    return this.toString();
};
async function bootstrap() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const payoutsService = app.get(payouts_service_1.PayoutsService);
    try {
        console.log("Calling getStaffPayoutsForCompanyMember...");
        const result = await payoutsService.getStaffPayoutsForCompanyMember(1n, 1n);
        console.log("RESULT JSON:", JSON.stringify(result));
    }
    catch (e) {
        console.error("BUG CRASH:", e);
    }
    await app.close();
    process.exit(0);
}
bootstrap();
//# sourceMappingURL=test-bug.js.map