import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateSpaceDto } from './dto/CreateSpace.dto';
import { UpdateSpaceDto } from './dto/UpdateSpace.dto';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { CloudinaryService } from 'src/lib/cloudinary/cloudinary.service';

@Injectable()
export class SpacesService {
  constructor(
    private prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) { }
  // create new space
  async create(userId: string, dto: CreateSpaceDto, files?: Express.Multer.File[]) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      throw new BadRequestException("Your Account is Not Found")
    }
    let uploadedImages: string[] = [];

    if (files && files.length > 0) {
      const uploadPromises = files.map(async (file) => {
        const result: any = await this.cloudinary.uploadImage(file, 'spaces');
        return result.secure_url;
      });
      uploadedImages = await Promise.all(uploadPromises);
    }

    // ✅ Convert strings to numbers (form-data always sends as strings)
    const price = parseFloat(dto.price as any);
    const capacity = dto.capacity ? parseInt(dto.capacity as any, 10) : null;

    // ✅ Ensure amenities is always an array
    const amenities =
      typeof dto.amenities === 'string'
        ? dto.amenities.split(',').map((a) => a.trim())
        : dto.amenities || [];

    const space = await this.prisma.space.create({
      data: {
        ownerId: userId,
        title: dto.title,
        description: dto.description,
        price,
        capacity,
        amenities,
        images: uploadedImages,
      },
    });

    return space;

  }
  //  find all space
  async list(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      throw new BadRequestException("Unauthorized Access.")
    }
    return this.prisma.space.findMany({ orderBy: { createdAt: 'desc' } });
  }
  // find space by Id
  async findOne(userId: string, id: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      throw new BadRequestException("Unauthorized Access.")
    }
    const space = await this.prisma.space.findUnique({ where: { id }, include: { reviews: true } })
    return space
  }

  // update Space........
  async update(userId: string, id: string, dto: UpdateSpaceDto, files?: Express.Multer.File[]) {
    console.log(dto)
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('Unauthorized Access.');

    const existing = await this.prisma.space.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Space not found');

    // Handle amenities safely
    const amenities =
      dto.amenities !== undefined
        ? Array.isArray(dto.amenities)
          ? dto.amenities
          : (dto.amenities as string).split(',').map(a => a.trim())
        : existing.amenities;

    // Handle image uploads
    let updatedImages = existing.images;
    if (files && files.length > 0) {
      const uploadPromises = files.map(file => this.cloudinary.uploadImage(file, 'spaces'));
      const uploadedImages = await Promise.all(uploadPromises);
      const newImageUrls = uploadedImages.map((img: any) => img.secure_url);
      updatedImages = newImageUrls;
    }
    // parse price.....
    const parsedPrice =
      dto.price !== undefined && dto.price !== null && dto.price !== ''
        ? parseFloat(dto.price as any)
        : undefined;

    const parsedCapacity =
      dto.capacity !== undefined && dto.capacity !== null && dto.capacity !== ''
        ? parseInt(dto.capacity as any)
        : undefined;

    // Prevent invalid number parsing
    if (parsedPrice !== undefined && isNaN(parsedPrice)) {
      throw new BadRequestException('Invalid price value.');
    }

    if (parsedCapacity !== undefined && isNaN(parsedCapacity)) {
      throw new BadRequestException('Invalid capacity value.');
    }
    // Final update
    const updatedSpace = await this.prisma.space.update({
      where: { id },
      data: {
        title: dto.title ?? existing.title,
        description: dto.description ?? existing.description,
        price: parsedPrice,
        capacity: parsedCapacity,
        amenities,
        images: updatedImages,
      },
    });

    return updatedSpace;
  }


  async delete(userId: string, id: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      throw new BadRequestException("Unauthorized Access.")
    }
    const existing = await this.prisma.space.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Space not found');

    await this.prisma.space.delete({ where: { id } });
    return null
  }
}
