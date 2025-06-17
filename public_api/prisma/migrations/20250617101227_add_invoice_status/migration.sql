-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('UPLOADED', 'PROCESSING', 'COMPLETED', 'ERROR');

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "status" "InvoiceStatus" NOT NULL DEFAULT 'UPLOADED';
