import { IsNotEmpty, IsString, IsOptional, IsIn } from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  @IsNotEmpty()
  bookingId: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['card', 'cash', 'bank', 'paypal', 'wallet'])
  method: string;

  @IsString()
  @IsOptional()
  transactionRef?: string;
}

export class UpdatePaymentDto {
  @IsString()
  @IsNotEmpty()
  status: string;

  @IsString()
  @IsOptional()
  transactionRef?: string;
}

export class CheckoutSessionDto {
  @IsString()
  @IsNotEmpty()
  bookingId: string;
}

export class CompletePaymentDto {
  @IsString()
  @IsNotEmpty()
  bookingId: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['cash', 'bank', 'paypal', 'wallet'])
  method: string;
}

export class ConfirmCashDto {
  @IsString()
  @IsNotEmpty()
  bookingId: string;

  @IsString()
  @IsOptional()
  staffNotes?: string;
}

export class PaypalOrderDto {
  @IsString()
  @IsNotEmpty()
  bookingId: string;
}

export class CapturePaypalDto {
  @IsString()
  @IsNotEmpty()
  orderID: string;

  @IsString()
  @IsNotEmpty()
  bookingId: string;
}
