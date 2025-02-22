import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { MenuService } from './menu.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';

@Controller('menus')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get()
  getMenus() {
    return this.menuService.getMenus();
  }

  @Get(':id')
  getMenu(@Param('id') id: string) {
    return this.menuService.getMenu(id);
  }

  @Post()
  createMenu(@Body() dto: CreateMenuDto) {
    return this.menuService.createMenu(dto);
  }

  @Put(':id')
  updateMenu(@Param('id') id: string, @Body() dto: UpdateMenuDto) {
    return this.menuService.updateMenu(dto);
  }

  @Delete(':id')
  deleteMenu(@Param('id') id: string) {
    return this.menuService.deleteMenu(id);
  }

  @Get(':id/specific')
  getSpecificMenu(@Param('id') id: string) {
    return this.menuService.getSpecificMenu(id);
  }
}
