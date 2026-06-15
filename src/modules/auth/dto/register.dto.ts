import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
    @ApiProperty({ example: 'oficina@exemplo.mz' })
    @IsEmail({}, { message: 'Email inválido' })
    email: string;

    @ApiProperty({ example: 'senha123' })
    @IsNotEmpty()
    @MinLength(6, { message: 'Password deve ter no mínimo 6 caracteres' })
    password: string;

    @ApiProperty({ example: 'Auto Mecânica Maputo' })
    @IsNotEmpty({ message: 'Nome obrigatório' })
    name: string;

    @ApiProperty({ example: 'oficina', enum: ['oficina', 'comprador', 'admin'], required: false })
    @IsOptional()
    @IsString()
    role?: string;

    @ApiProperty({ example: '+258 84 000 0000', required: false })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiProperty({ example: '123456789', required: false })
    @IsOptional()
    @IsString()
    nuit?: string;

    @ApiProperty({ example: 'Av. Eduardo Mondlane, Maputo', required: false })
    @IsOptional()
    @IsString()
    address?: string;
}
