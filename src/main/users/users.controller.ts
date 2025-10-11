import { Controller, Get, Patch, Body, UseGuards, Req, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { UpdateUserDto } from './dto/userUpdate.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { handleRequest } from 'src/common/utils/handle.request';


@ApiTags("Users")
@ApiBearerAuth("JWT-auth")
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) { }

  // Get profile
  @Get('me')
  async me(@GetUser('id') userId: string) {
    return handleRequest(
      () => this.usersService.findById(userId),
      "Get your information successfully",
    );
  }

  // update profile 
  @Patch('me')
  async update(@GetUser('id') userId: string, @Body() dto: UpdateUserDto) {
    return handleRequest(
      () => this.usersService.updateProfile(userId, dto),
      "Update profile successfully",
    );
  }
}
