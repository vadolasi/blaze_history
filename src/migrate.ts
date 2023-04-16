import { verbose } from "sqlite3"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const sqlite = verbose()

const db = new sqlite.Database("saved-data.db")

db.serialize(() => {
  db.all("SELECT * FROM Entry", async (err, rows) => {
    await prisma.entry.deleteMany()

    for (const data of rows) {
      const row = data as { id: number, white: number, win: number }
      await prisma.entry.create({
        data: {
          id: row.id,
          white: Boolean(row.white),
          win: Boolean(row.win),
          redPercentage: 50.0,
          blackPercentage: 50.0,
          type: "most"
        }
      })
    }
  })
})

db.close()
