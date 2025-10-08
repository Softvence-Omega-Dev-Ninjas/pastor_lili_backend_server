import { Controller, Get, Patch, Body, UseGuards, Req, Post } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { UsersService } from './users.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { UpdateUserDto } from './dto/userUpdate.dto';


@ApiTags("Users")
@ApiBearerAuth("JWT-auth")
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) { }

  @Get('me')
  me(@GetUser('id') userId: string) {
    return this.usersService.findById(userId);
  }

  @Patch('me')
  update(@GetUser('id') userId: string, @Body() dto: UpdateUserDto) {
    return this.usersService.updateProfile(userId, dto);
  }
}
