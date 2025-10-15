-- AlterTable
ALTER TABLE "Space" ADD COLUMN     "guidelines" TEXT,
ADD COLUMN     "subTitle" TEXT,
ALTER COLUMN "description" DROP NOT NULL;
