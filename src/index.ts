import { Server } from "hyper-express"
import { readFileSync } from "fs"
import { Server as IO } from "socket.io"
import { Scrapper } from "./scrapper"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const html = readFileSync("./src/index.html", "utf8")

const app = new Server()

app.get("/", async (_req, res) => {
  res.send(html)
})

app.get("/entries", async (_req, res) => {
  const entries = await prisma.entry.findMany()
  res.json(entries.map(entry => entry.win))
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

  scrapper.listen(async (red, black, win) => {
    io.emit("run", { red, black, win })
    await prisma.entry.create({
      data: {
        red,
        black,
        win
      }
    })
  })
})()

app.listen(3000)
