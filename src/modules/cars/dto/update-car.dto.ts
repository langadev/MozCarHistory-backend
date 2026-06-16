import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

const currentYear = new Date().getFullYear();

export class UpdateCarDto {
    @IsOptional() @IsString() brand?: string;
    @IsOptional() @IsString() model?: string;
    @IsOptional() @IsString() color?: string;
    @IsOptional() @IsString() fuelType?: string;
    @IsOptional() @IsString() engineType?: string;
    @IsOptional() @IsString() driveType?: string;
    @IsOptional() @IsString() transmission?: string;
    @IsOptional() @IsString() engineSize?: string;
    @IsOptional() @IsString() bodyType?: string;
    @IsOptional() @IsString() situation?: string;

    @IsOptional() @Type(() => Number) @IsInt() @Min(1950) @Max(currentYear + 1)
    year?: number;

    @IsOptional() @Type(() => Number) @IsInt() @Min(0)
    initialMileage?: number;

    @IsOptional() @Type(() => Number) @IsInt() @Min(1950) @Max(currentYear + 1)
    importYear?: number;
}
