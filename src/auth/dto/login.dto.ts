import { Transform } from "class-transformer";
import { IsEmail, IsString, Length } from "class-validator";

export class LoginDto{
    @IsEmail()
    email: string;
  
    @Transform(({value}) => value.trim()) //Limpia los caracteres en blanco
    @IsString()
    @Length(8,20)
    password: string;
}