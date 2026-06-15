import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateMechanicDto {
    @IsNotEmpty({ message: 'Nome obrigatório' })
    @IsString()
    name: string;

    @IsEmail({}, { message: 'Email inválido' })
    email: string;

    @IsNotEmpty()
    @IsString()
    @MinLength(6, { message: 'A senha deve ter pelo menos 6 caracteres' })
    password: string;

    @IsOptional()
    @IsString()
    specialty?: string;

    @IsOptional()
    @IsString()
    phone?: string;
}
