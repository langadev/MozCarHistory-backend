import { IsNotEmpty, IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRecordDto {
    @ApiProperty({ example: 1 })
    @Type(() => Number)
    @IsNumber()
    carId: number;

    @ApiProperty({ example: 2 })
    @Type(() => Number)
    @IsNumber()
    workshopId: number;

    @ApiProperty({ example: 45000 })
    @Type(() => Number)
    @IsNumber()
    @Min(0, { message: 'Quilometragem não pode ser negativa' })
    mileage: number;

    @ApiProperty({ example: 'Mudança de óleo e filtro de ar' })
    @IsNotEmpty({ message: 'Descrição obrigatória' })
    @IsString()
    description: string;

    @ApiProperty({ example: 'Óleo 5W30, Filtro WIX 51516', required: false })
    @IsOptional()
    @IsString()
    parts?: string;

    @ApiProperty({ example: 'João Machava', required: false })
    @IsOptional()
    @IsString()
    mechanic?: string;
}
