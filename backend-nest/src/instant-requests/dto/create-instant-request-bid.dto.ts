import { IsNotEmpty, IsNumber, Min } from 'class-validator';

export class CreateInstantRequestBidDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  priceEstimate: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  etaMinutes: number;
}
