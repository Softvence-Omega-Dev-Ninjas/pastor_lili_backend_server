/*
  Warnings:

  - The `amenities` column on the `Space` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Amenity" AS ENUM ('WIFI', 'AIR_CONDITIONING', 'PARKING_AVAILABLE');

-- AlterTable
ALTER TABLE "Space" DROP COLUMN "amenities",
ADD COLUMN     "amenities" "Amenity"[] DEFAULT ARRAY[]::"Amenity"[];
