-- CreateEnum
CREATE TYPE "LogType" AS ENUM ('login', 'logout');

-- CreateTable
CREATE TABLE "Log" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "type" "LogType" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Log_pkey" PRIMARY KEY ("id")
);
