import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateRecordDto {
    @IsOptional() @Type(() => Number) @IsInt() @Min(0) mileage?: number;
    @IsOptional() @IsString() serviceType?: string;
    @IsOptional() @IsString() description?: string;
    @IsOptional() @IsString() parts?: string;
    @IsOptional() @Type(() => Number) @IsInt() @Min(0) cost?: number;
    @IsOptional() @Type(() => Number) @IsInt() @Min(0) nextServiceMileage?: number;
    @IsOptional() @Type(() => Number) @IsInt() mechanicId?: number;
}
