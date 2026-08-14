import { IsNotEmpty, IsString, IsOptional, IsIn } from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  @IsNotEmpty()
  bookingId: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['card', 'cash', 'bank', 'wallet'])
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

  @IsString()
  @IsOptional()
  @IsIn(['khqr', 'deeplink'])
  type?: 'khqr' | 'deeplink';
}

export class CompletePaymentDto {
  @IsString()
  @IsNotEmpty()
  bookingId: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['cash', 'bank', 'wallet'])
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
