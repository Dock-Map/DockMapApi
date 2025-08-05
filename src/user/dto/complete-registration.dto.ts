import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber } from 'class-validator';
import { UserRole } from 'src/shared/types/user.role';

export class CompleteRegistrationDto {
  @ApiProperty({ description: 'ID города' })
  @IsNumber()
  cityId: number;

  @ApiProperty({
    description: 'Роль пользователя',
    enum: [UserRole.OWNER, UserRole.CLUB_ADMIN],
    example: UserRole.OWNER,
  })
  @IsEnum([UserRole.OWNER, UserRole.CLUB_ADMIN])
  role: UserRole.OWNER | UserRole.CLUB_ADMIN;
}
