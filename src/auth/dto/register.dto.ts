import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsString, Length } from "class-validator";

export class RegisterDto{
    @Transform(({value}) => value.trim()) //Limpia los caracteres en blanco
    @IsString()
    @Length(5, 50) 
    username: string;
  
    @IsEmail()
    email: string;
  
    @Transform(({value}) => value.trim()) //Limpia los caracteres en blanco
    @IsString()
    @Length(8,20)
    password: string;
}