import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, Menu } from '@prisma/client';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';

const prisma = new PrismaClient();

@Injectable()
export class MenuService {
  // Get all menus in a hierarchical structure
  async getMenus() {
    return prisma.menu.findMany({
      where: { parentId: null },
      include: {
        children: {
          include: {
            children: {
              include: {
                children: true,
              },
            },
          },
        },
      },
    });
  }

  // Get a single menu (with children)
  async getMenu(id: string) {
    return prisma.menu.findUnique({
      where: { id },
      include: {
        parent: true,
        children: {
          include: {
            children: true,
          },
        },
      },
    });
  }

  async createMenu(dto: CreateMenuDto) {
    return prisma.menu.create({
      data: {
        name: dto.name,
        parentId: dto.parentId || null,
      },
    });
  }

  async updateMenu(dto: UpdateMenuDto) {
    const { selectedMenuId, selectedMenuName, parentMenuName } = dto;

    // Find the selected menu
    const selectedMenu = await prisma.menu.findUnique({
      where: { id: selectedMenuId },
    });
    if (!selectedMenu) {
      throw new NotFoundException('Selected menu not found');
    }

    // Update the selected menu's name
    const updatedSelectedMenu = await prisma.menu.update({
      where: { id: selectedMenuId },
      data: { name: selectedMenuName },
    });

    let updatedParentMenu: Menu | null = null;
    // If the selected menu has an immediate parent and a new parent name is provided, update it.
    if (selectedMenu.parentId && parentMenuName) {
      updatedParentMenu = await prisma.menu.update({
        where: { id: selectedMenu.parentId },
        data: { name: parentMenuName },
      });
    }

    return {
      selectedMenu: updatedSelectedMenu,
      parentMenu: updatedParentMenu,
    };
  }

  async deleteMenu(id: string) {
    // Potentially handle recursive delete if needed
    return prisma.menu.delete({
      where: { id },
    });
  }

  /**
   * Recursively builds the menu tree while computing the `depth` and `parentName` values.
   * This function assumes the passed `depth` is the current level (with root having depth 0).
   *
   * @param id - The menu ID from which to build the subtree.
   * @param depth - The current depth level.
   * @param parentName - The immediate parent's name.
   */
  private async buildTree(
    id: string,
    depth = 0,
    parentName: string | null = null,
  ): Promise<
    | (Menu & { children: any[]; depth: number; parentName: string | null })
    | null
  > {
    // Fetch the current menu item
    const menu = await prisma.menu.findUnique({ where: { id } });
    if (!menu) return null;

    // Fetch children of the current menu item
    const children = await prisma.menu.findMany({ where: { parentId: id } });

    return {
      ...menu,
      depth, // computed depth (relative to the root)
      parentName, // computed parentName (or null for the root)
      children: await Promise.all(
        children.map((child) => this.buildTree(child.id, depth + 1, menu.name)),
      ),
    };
  }

  /**
   * Returns the branch from the root to the selected menu (with its subtree)
   * such that the computed `depth` reflects the number of layers from the root.
   * For example, if the selected menu is 3 levels deep, it will have depth = 3.
   */
  async getSpecificMenu(menuId: string) {
    // 1. Find the selected menu.
    const selected = await prisma.menu.findUnique({ where: { id: menuId } });
    if (!selected) {
      throw new NotFoundException('Menu not found');
    }

    // 2. Get the immediate parent's info, if available.
    let immediateParent: Menu | null = null;
    if (selected.parentId) {
      immediateParent = await prisma.menu.findUnique({
        where: { id: selected.parentId },
      });
    }

    // 3. Compute the depth: the number of ancestors from the root.
    // If the selected menu has no parent, depth is 0.
    let depth = 0;
    let current = selected;
    while (current.parentId) {
      depth++;
      const parent = await prisma.menu.findUnique({
        where: { id: current.parentId },
      });
      if (!parent) break;
      current = parent;
    }

    // 4. Return only the selected menu's details.
    return {
      id: selected.id,
      name: selected.name,
      depth, // computed depth from the root
      parentId: immediateParent ? immediateParent.id : null,
      parentName: immediateParent ? immediateParent.name : null,
    };
  }
}
