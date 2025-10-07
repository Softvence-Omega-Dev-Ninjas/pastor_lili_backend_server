import { Controller, Get, Patch, Body, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: any) {
    return this.usersService.findById(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  update(@Req() req: any, @Body() body: any) {
    return this.usersService.updateProfile(req.user.sub, body);
  }
}
