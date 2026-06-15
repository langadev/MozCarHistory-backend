import { IsNotEmpty, IsOptional, IsString, IsNumber, IsInt, Min } from 'class-validator';
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

    @ApiProperty({ example: 'Troca de Óleo', required: false })
    @IsOptional()
    @IsString()
    serviceType?: string;

    @ApiProperty({ example: 'Mudança de óleo e filtro de ar' })
    @IsNotEmpty({ message: 'Descrição obrigatória' })
    @IsString()
    description: string;

    @ApiProperty({ example: 'Óleo 5W30, Filtro WIX 51516', required: false })
    @IsOptional()
    @IsString()
    parts?: string;

    @ApiProperty({ example: 4500, required: false, description: 'Custo em MZN' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    cost?: number;

    @ApiProperty({ example: 50000, required: false, description: 'Quilometragem do próximo serviço' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    nextServiceMileage?: number;

    @ApiProperty({ example: 1, required: false })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    mechanicId?: number;
}
