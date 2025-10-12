import { Controller, Get, Patch, Body, UseGuards, Req, Post, UseInterceptors, UploadedFile, ConflictException } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { UpdateUserDto } from './dto/userUpdate.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { handleRequest } from 'src/common/utils/handle.request';
import { FileInterceptor } from '@nestjs/platform-express';


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
  @ApiOperation({summary: "Update user information"})
  @Patch('me')
  @ApiConsumes('multipart/form-data')
  @ApiBody({type: UpdateUserDto, required: false})
  @UseInterceptors(FileInterceptor('file')) //'image' is the name of the form field
  async update(
    @GetUser('id') userId: string,
    @Body() dto: UpdateUserDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    
    if(file){
      const {secure_url}: any = await this.usersService.uploadProfileImage(file);
      if(!secure_url) throw new ConflictException('not found');
      dto['avatar']= secure_url;
    }
    return handleRequest(
      () => this.usersService.updateProfile(userId, dto),
      "Update profile successfully",
    );
  }
}
