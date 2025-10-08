import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards } from '@nestjs/common';
import { SpacesService } from './spaces.service';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Reflector } from '@nestjs/core';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { CreateSpaceDto } from './dto/CreateSpace.dto';
import { handleRequest } from 'src/common/utils/handle.request';


@ApiTags("Spaces")
@ApiBearerAuth("JWT-auth")
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('spaces')
export class SpacesController {
  constructor(private spacesService: SpacesService, private reflector: Reflector) { }

  @Get("/")
  list(@GetUser('id') userId: string) {
    return handleRequest(() => this.spacesService.list(userId), 'Get All Space Successfully')

  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.spacesService.findOne(id);
  }

  // Admin routes (create/update/delete)
  @Roles('ADMIN', 'SUPERADMIN')
  @Post("/")
  create(@Body() dto: CreateSpaceDto, @GetUser('id') userId: string) {
    return handleRequest(
      () => this.spacesService.create(userId, dto),
      'Space created successfully',
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.spacesService.update(id, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.spacesService.delete(id);
  }
}
