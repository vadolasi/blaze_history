-- CreateTable
CREATE TABLE "Entry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "white" BOOLEAN NOT NULL,
    "win" BOOLEAN NOT NULL,
    "blackPercentage" REAL NOT NULL,
    "redPercentage" REAL NOT NULL,
    "type" TEXT NOT NULL
);
