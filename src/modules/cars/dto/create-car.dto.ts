import { IsNotEmpty, IsOptional, IsString, IsNumber, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

const currentYear = new Date().getFullYear();

export class CreateCarDto {
    @ApiProperty({ example: 'MP-12-34-AB' })
    @IsNotEmpty({ message: 'Matrícula obrigatória' })
    @IsString()
    plateNumber: string;

    @ApiProperty({ example: 'Toyota' })
    @IsNotEmpty({ message: 'Marca obrigatória' })
    @IsString()
    brand: string;

    @ApiProperty({ example: 'Hilux' })
    @IsNotEmpty({ message: 'Modelo obrigatório' })
    @IsString()
    model: string;

    @ApiProperty({ example: '1HGBH41JXMN109186', required: false })
    @IsOptional()
    @IsString()
    vin?: string;

    @ApiProperty({ example: 2019, required: false })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1950)
    @Max(currentYear + 1)
    year?: number;

    @ApiProperty({ example: 'Branco', required: false })
    @IsOptional()
    @IsString()
    color?: string;

    @ApiProperty({ example: 'Gasóleo', required: false })
    @IsOptional()
    @IsString()
    fuelType?: string;

    @ApiProperty({ example: 'Manual', required: false })
    @IsOptional()
    @IsString()
    transmission?: string;

    @ApiProperty({ example: '2.0L', required: false })
    @IsOptional()
    @IsString()
    engineSize?: string;

    @ApiProperty({ example: 'SUV', required: false })
    @IsOptional()
    @IsString()
    bodyType?: string;

    @ApiProperty({ example: 45000, required: false })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    initialMileage?: number;

    @ApiProperty({ example: 1, required: false })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    ownerId?: number;
}
