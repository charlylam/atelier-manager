-- AlterTable
ALTER TABLE "worksites" ADD COLUMN     "delivered_at" TIMESTAMPTZ;

-- Les chantiers livrés sont figés : leur dernière modification est la livraison.
UPDATE "worksites" SET "delivered_at" = "updated_at" WHERE "status" = 'delivered';
