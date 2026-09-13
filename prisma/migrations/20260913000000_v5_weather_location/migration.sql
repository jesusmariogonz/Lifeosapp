-- CreateTable
CREATE TABLE "WeatherLocation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeatherLocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WeatherLocation_userId_idx" ON "WeatherLocation"("userId");

-- AddForeignKey
ALTER TABLE "WeatherLocation" ADD CONSTRAINT "WeatherLocation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
