import { Server } from "hyper-express"
import { Server as IO } from "socket.io"
import { Scrapper } from "./scrapper"
import { PrismaClient } from "@prisma/client"
import { readFile } from "fs/promises"
import { readFileSync } from "fs"

const prisma = new PrismaClient()

const app = new Server()

const html = readFileSync("./src/index.html")
const worker = readFileSync("./src/worker.js")

app.get("/", async (_req, res) => {
  res.send(html)
})

app.get("/worker.js", async (_req, res) => {
  res.setHeader("Content-Type", "text/javascript")
  res.send(worker)
})

app.get("/entries", async (req, res) => {
  const quantity = Number(req.query.quantity)
  const [entries, savedMaxConsecutiveWins, savedMaxConsecutiveLoses, savedMaxConsecutiveWinsWithoutWhite] = await prisma.$transaction([
    prisma.entry.findMany({
      take: quantity,
      orderBy: {
        id: "desc"
      }
    }),
    prisma.entry.aggregate({
      _max: {
        sequence: true
      },
      where: {
        win: true
      },
      take: quantity
    }),
    prisma.entry.aggregate({
      _max: {
        sequence: true
      },
      where: {
        win: false
      },
      take: quantity
    }),
    prisma.entry.aggregate({
      _max: {
        sequenceWithoutWhite: true
      },
      where: {
        win: true,
        white: false
      },
      take: quantity
    })
  ])

  entries.reverse()

  let maxConsecutiveWins = 1
  let maxConsecutiveLoses = 1
  let maxConsecutiveWinsWithoutWhite = 1

  if (savedMaxConsecutiveWins._max?.sequence) {
    maxConsecutiveWins = savedMaxConsecutiveWins._max.sequence + 1
  }

  if (savedMaxConsecutiveLoses._max?.sequence) {
    maxConsecutiveLoses = savedMaxConsecutiveLoses._max.sequence + 1
  }

  if (savedMaxConsecutiveWinsWithoutWhite._max?.sequenceWithoutWhite) {
    maxConsecutiveWinsWithoutWhite = savedMaxConsecutiveWinsWithoutWhite._max.sequenceWithoutWhite + 1
  }

  res.json({ entries, maxConsecutiveWins, maxConsecutiveLoses, maxConsecutiveWinsWithoutWhite })
})

app.get("/images/:name", async (req, res) => {
  const name = req.params.name

  res.setHeader("Content-Type", "image/webp")
  res.send(await readFile(`./src/images/${name}`))
})

const io = new IO()

io.attachApp(app.uws_instance)

io.on("connection", (socket) => {
  socket.on("message", (message) => {
    console.log(message)
  })
})

;(async () => {
  const scrapper = new Scrapper()
  await scrapper.init()

  await app.listen(3000)
  console.log("Listening on port 3000")

  scrapper.listen(
    async (white, win) => {
      const last = await prisma.entry.findFirst({
        orderBy: {
          id: "desc"
        }
      })

      let sequence = 1

      if (last && last.win === win) {
        sequence = last.sequence + 1
      }

      let sequenceWithoutWhite = 1

      if (last && last.win && !last.white) {
        sequenceWithoutWhite = last.sequenceWithoutWhite + 1
      }

      await prisma.entry.create({
        data: {
          white,
          win,
          sequence,
          sequenceWithoutWhite
        }
      })
      io.emit("result", { white, win, sequence, sequenceWithoutWhite })
    },
    (red, black) => {
      io.emit("graph", { red, black })
    }
  )
})()

app.listen(3000)
