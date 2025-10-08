import { Controller, Get, Patch, Body, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { UsersService } from './users.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GetUser } from 'src/common/decorators/get-user.decorator';


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
  update(@Req() req: any, @Body() body: any) {
    return this.usersService.updateProfile(req.user.sub, body);
  }
}
