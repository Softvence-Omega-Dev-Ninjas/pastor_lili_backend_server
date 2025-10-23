import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateSpaceDto } from './dto/CreateSpace.dto';
import { UpdateSpaceDto } from './dto/UpdateSpace.dto';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { CloudinaryService } from 'src/lib/cloudinary/cloudinary.service';
import { Amenity } from '@prisma/client';

@Injectable()
export class SpacesService {
  constructor(
    private prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  // -------------------- CREATE SPACE --------------------
  async create(
    userId: string,
    dto: CreateSpaceDto,
    files?: Express.Multer.File[],
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('Your account is not found');
    }

    // -------------------- upload Images --------------------
    let uploadedImages: string[] = [];
    if (files && files.length > 0) {
      const uploadPromises = files.map(async (file) => {
        const result: any = await this.cloudinary.uploadImage(file, 'spaces');
        return result.secure_url;
      });
      uploadedImages = await Promise.all(uploadPromises);
    }

    // -------------------- parse Numbers --------------------
    const price =
      typeof dto.price === 'string' ? parseFloat(dto.price) : dto.price;
    const capacity = dto.capacity
      ? typeof dto.capacity === 'string'
        ? parseInt(dto.capacity, 10)
        : dto.capacity
      : null;

    // -------------------- parse Amenities --------------------
    const amenities: Amenity[] = [];

    if (dto.amenities) {
      // force TypeScript to treat as string | Amenity[]
      const rawAmenities: string[] =
        typeof dto.amenities === 'string'
          ? (dto.amenities as string)
              .split(',')
              .map((a) => a.trim().toUpperCase().replace(/ /g, '_'))
          : (dto.amenities as Amenity[]).map((a) =>
              a.toString().toUpperCase().replace(/ /g, '_'),
            );

      rawAmenities.forEach((a) => {
        if (Object.values(Amenity).includes(a as Amenity)) {
          amenities.push(a as Amenity);
        }
      });
    }

    // -------------------- Create Space --------------------
    const space = await this.prisma.space.create({
      data: {
        ownerId: userId,
        title: dto.title,
        subTitle: dto.subTitle,
        description: dto.description,
        guidelines: dto.guidelines,
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
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('Unauthorized Access.');
    }
    const spaces = await this.prisma.space.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return spaces;
  }
  // find space by Id
  async findOne(userId: string, id: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('Unauthorized Access.');
    }
    const space = await this.prisma.space.findUnique({
      where: { id },
      include: { reviews: true },
    });
    return space;
  }

  // -------------------- UPDATE SPACE --------------------
  async update(
    userId: string,
    spaceId: string,
    dto: UpdateSpaceDto,
    files?: Express.Multer.File[],
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User is Not Found.');
    }
    const space = await this.prisma.space.findUnique({
      where: { id: spaceId },
    });
    if (!space) {
      throw new BadRequestException('Space not found');
    }

    // upload new images if provided
    let uploadedImages: string[] = [];
    if (files && files.length > 0) {
      const uploadPromises = files.map(async (file) => {
        const result: any = await this.cloudinary.uploadImage(file, 'spaces');
        return result.secure_url;
      });
      uploadedImages = await Promise.all(uploadPromises);
    }

    // parse numbers
    const price = dto.price
      ? typeof dto.price === 'string'
        ? parseFloat(dto.price)
        : dto.price
      : undefined;
    const capacity = dto.capacity
      ? typeof dto.capacity === 'string'
        ? parseInt(dto.capacity, 10)
        : dto.capacity
      : undefined;

    // parse amenities
    const amenities: Amenity[] = []; // always an array, never undefined

    if (dto.amenities) {
      // narrow the type to string | Amenity[]
      const rawAmenities: string[] =
        typeof dto.amenities === 'string'
          ? (dto.amenities as string) // type assertion allows .split()
              .split(',')
              .map((a) => a.trim().toUpperCase().replace(/ /g, '_'))
          : (dto.amenities as Amenity[]).map((a) =>
              a.toString().toUpperCase().replace(/ /g, '_'),
            );

      // filter only valid enum values
      rawAmenities.forEach((a) => {
        if (Object.values(Amenity).includes(a as Amenity)) {
          amenities.push(a as Amenity);
        }
      });
    }

    // merge old images with new ones
    const images =
      uploadedImages.length > 0
        ? [...space.images, ...uploadedImages]
        : space.images;

    // update space
    const updatedSpace = await this.prisma.space.update({
      where: { id: spaceId },
      data: {
        title: dto.title ?? space.title,
        subTitle: dto.subTitle ?? space.subTitle,
        description: dto.description ?? space.description,
        guidelines: dto.guidelines ?? space.guidelines,
        price: price ?? space.price,
        capacity: capacity ?? space.capacity,
        amenities: amenities ?? space.amenities,
        images,
      },
    });

    return updatedSpace;
  }

  // remove space.....
  async delete(userId: string, id: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('Unauthorized Access.');
    }
    const existing = await this.prisma.space.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Space not found');

    await this.prisma.space.delete({ where: { id } });
    return null;
  }
}
