-- CreateTable
CREATE TABLE "Entry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "white" BOOLEAN NOT NULL,
    "win" BOOLEAN NOT NULL,
    "sequence" INTEGER NOT NULL,
    "sequenceWithoutWhite" INTEGER NOT NULL
);
