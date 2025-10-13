import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards } from '@nestjs/common';
import { SpacesService } from './spaces.service';
import { Reflector } from '@nestjs/core';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { CreateSpaceDto } from './dto/CreateSpace.dto';
import { handleRequest } from 'src/common/utils/handle.request';
import { UpdateSpaceDto } from './dto/UpdateSpace.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';


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
  create(@Body() dto: CreateSpaceDto, @GetUser('id') userId: string) {
    return handleRequest(
      () => this.spacesService.create(userId, dto),
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

  @ApiOperation({ summary: "Protected Route For (ADMIN)" })
  @Roles('ADMIN', 'SUPERADMIN')
  @Patch(':id')
  update(@GetUser('id') userId: string, @Param('id') id: string, @Body() dto: UpdateSpaceDto) {
    return handleRequest(
      () => this.spacesService.update(userId, id, dto),
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
