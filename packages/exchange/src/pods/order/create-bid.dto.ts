import { Type } from 'class-transformer';
import { IsDate, IsInt, IsNotEmpty, IsPositive, Validate } from 'class-validator';
import { IntUnitsOfEnergy, PositiveBNStringValidator } from '@energyweb/origin-backend-utils';

import { ApiProperty } from '@nestjs/swagger';

export class CreateBidDTO<TProduct> {
    @ApiProperty({ type: String })
    @IsNotEmpty()
    @Validate(PositiveBNStringValidator)
    @Validate(IntUnitsOfEnergy)
    readonly volume: string;

    @ApiProperty({ type: Number })
    @IsNotEmpty()
    @IsInt()
    @IsPositive()
    readonly price: number;

    @ApiProperty({ type: Date })
    @IsNotEmpty()
    @IsDate()
    @Type(() => Date)
    readonly validFrom: Date;

    readonly product: TProduct;
}
