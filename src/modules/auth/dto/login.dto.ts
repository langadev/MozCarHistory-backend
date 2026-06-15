import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
    @ApiProperty({ example: 'oficina@exemplo.mz' })
    @IsEmail({}, { message: 'Email inválido' })
    email: string;

    @ApiProperty({ example: 'senha123' })
    @IsNotEmpty({ message: 'Password obrigatória' })
    password: string;

    @ApiProperty({ example: 'oficina', enum: ['oficina', 'comprador', 'admin'], required: false })
    @IsOptional()
    @IsString()
    role?: string;
}
