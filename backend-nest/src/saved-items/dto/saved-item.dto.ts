import { IsNotEmpty, IsString, IsIn } from 'class-validator';

export class SavedItemDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['company', 'service'])
  itemType: string;

  @IsString()
  @IsNotEmpty()
  itemId: string;
}
