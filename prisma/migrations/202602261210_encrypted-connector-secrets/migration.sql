ALTER TABLE "Connector" ADD COLUMN "credentialCiphertext" TEXT;
ALTER TABLE "Connector" ADD COLUMN "credentialIv" TEXT;
ALTER TABLE "Connector" ADD COLUMN "credentialTag" TEXT;
ALTER TABLE "Connector" ADD COLUMN "credentialKeyVersion" TEXT DEFAULT 'v1';
