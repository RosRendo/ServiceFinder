import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PayoutsService } from './payouts/payouts.service';

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const payoutsService = app.get(PayoutsService);
  
  try {
    console.log("Calling getStaffPayoutsForCompanyMember...");
    const result = await payoutsService.getStaffPayoutsForCompanyMember(1n, 1n);
    console.log("RESULT JSON:", JSON.stringify(result));
  } catch(e) {
    console.error("BUG CRASH:", e);
  }
  
  await app.close();
  process.exit(0);
}
bootstrap();
