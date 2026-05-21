/*
  Warnings:

  - Made the column `status` on table `Aula` required. This step will fail if there are existing NULL values in that column.
  - Made the column `colaboradora` on table `Aula` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Aula" ADD COLUMN     "codigoMatricula" TEXT,
ADD COLUMN     "faltou" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "posAulaRealizado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "remarcou" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "veio" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "vendaEfetivada" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "status" SET NOT NULL,
ALTER COLUMN "colaboradora" SET NOT NULL;
