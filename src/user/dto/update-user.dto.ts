import { IsOptional, IsEmail, IsNotEmpty, Length } from 'class-validator';

export class UpdateUserDto {
    @IsOptional()
    @IsNotEmpty()
    username?: string;
  
    @IsOptional()
    @IsEmail()
    email?: string;
  
    @IsOptional()
    @Length(8,20)
    password?: string;
}