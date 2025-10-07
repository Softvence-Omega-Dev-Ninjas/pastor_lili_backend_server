import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards } from '@nestjs/common';
import { SpacesService } from './spaces.service';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Reflector } from '@nestjs/core';

@Controller('spaces')
export class SpacesController {
  constructor(private spacesService: SpacesService, private reflector: Reflector) {}

  @Get()
  list() {
    return this.spacesService.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.spacesService.findOne(id);
  }

  // Admin routes (create/update/delete)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @Post()
  create(@Body() body: any) {
    return this.spacesService.create(body);
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
