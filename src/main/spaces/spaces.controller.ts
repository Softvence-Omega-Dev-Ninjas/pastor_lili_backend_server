import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { SpacesService } from './spaces.service';
import { Reflector } from '@nestjs/core';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { CreateSpaceDto } from './dto/CreateSpace.dto';
import { handleRequest } from 'src/common/utils/handle.request';
import { UpdateSpaceDto } from './dto/UpdateSpace.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { FilesInterceptor } from '@nestjs/platform-express';


@ApiTags("Spaces")
@ApiBearerAuth("JWT-auth")
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('spaces')
export class SpacesController {
  constructor(private spacesService: SpacesService, private reflector: Reflector) { }

  // create new space only create admin and superAdmin.
  // Admin routes (create/update/delete)
  @ApiOperation({ summary: "Protected Route For (ADMIN)" })
  @Roles('ADMIN', 'SUPERADMIN')
  @Post("/")
  @UseInterceptors(FilesInterceptor('files', 5)) // <-- multiple files
  @ApiConsumes('multipart/form-data')
  create(
    @Body() dto: CreateSpaceDto,
    @UploadedFiles() files: Express.Multer.File[],
    @GetUser('id') userId: string
  ) {
    return handleRequest(
      () => this.spacesService.create(userId, dto, files),
      'Space created successfully',
    );
  }


  @Get("/")
  list(@GetUser('id') userId: string) {
    return handleRequest(() => this.spacesService.list(userId), 'Get All Space Successfully')

  }

  @Get(':id')
  get(@Param('id') id: string, @GetUser('id') userId: string) {
    return handleRequest(
      () => this.spacesService.findOne(userId, id),
      'Get A Space successfully ',
    );
  }

  @ApiOperation({ summary: 'Protected Route For (ADMIN)' })
  @Roles('ADMIN', 'SUPERADMIN')
  @Patch(':id')
  @UseInterceptors(FilesInterceptor('files', 5)) // allow up to 5 new images
  @ApiConsumes('multipart/form-data')
  update(
    @GetUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSpaceDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return handleRequest(
      () => this.spacesService.update(userId, id, dto, files),
      'Space updated successfully',
    );
  }

  @ApiOperation({ summary: "Protected Route For (ADMIN)" })
  @Roles('ADMIN', 'SUPERADMIN')
  @Delete(':id')
  delete(@GetUser('id') userId: string, @Param('id') id: string) {
    return handleRequest(
      () => this.spacesService.delete(userId, id),
      'Space Deleted successfully',
    );
  }
}
