import { Server } from "hyper-express"
import { Server as IO } from "socket.io"
import { Scrapper } from "./scrapper"
import { PrismaClient } from "@prisma/client"
import { readFile } from "fs/promises"

const prisma = new PrismaClient()

const app = new Server()

app.get("/", async (_req, res) => {
  res.send(await readFile("./src/index.html"))
})

app.get("/entries", async (req, res) => {
  const quantity = Number(req.query.quantity)
  const entries = await prisma.entry.findMany({ take: quantity })
  res.json(entries.map(entry => entry.win))
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
    async (red, black, win) => {
      io.emit("result", { red, black, win })
      await prisma.entry.create({
        data: {
          red,
          black,
          win
        }
      })
    },
    (red, black) => {
      io.emit("graph", { red, black })
    }
  )
})()

app.listen(3000)
