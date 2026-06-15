import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCarDto {
    @ApiProperty({ example: 'MP-12-34-AB' })
    @IsNotEmpty({ message: 'Matrícula obrigatória' })
    @IsString()
    plateNumber: string;

    @ApiProperty({ example: 'Toyota Hilux 2020' })
    @IsNotEmpty({ message: 'Marca/Modelo obrigatório' })
    @IsString()
    brandModel: string;

    @ApiProperty({ example: '1HGBH41JXMN109186', required: false })
    @IsOptional()
    @IsString()
    vin?: string;

    @ApiProperty({ example: 1, required: false })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    ownerId?: number;
}
