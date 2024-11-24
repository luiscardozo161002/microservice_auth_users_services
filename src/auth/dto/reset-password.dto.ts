import { IsNotEmpty, Length } from 'class-validator';

export class ResetPasswordDto {
  @IsNotEmpty()
  @Length(8, 20)
  newPassword: string;
}
