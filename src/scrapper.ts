import { chromium, Page } from "playwright"

const args = [
  "--autoplay-policy=user-gesture-required",
  "--disable-background-networking",
  "--disable-background-timer-throttling",
  "--disable-backgrounding-occluded-windows",
  "--disable-breakpad",
  "--disable-client-side-phishing-detection",
  "--disable-component-update",
  "--disable-default-apps",
  "--disable-dev-shm-usage",
  "--disable-domain-reliability",
  "--disable-extensions",
  "--disable-features=AudioServiceOutOfProcess",
  "--disable-hang-monitor",
  "--disable-ipc-flooding-protection",
  "--disable-notifications",
  "--disable-offer-store-unmasked-wallet-cards",
  "--disable-popup-blocking",
  "--disable-print-preview",
  "--disable-prompt-on-repost",
  "--disable-renderer-backgrounding",
  "--disable-setuid-sandbox",
  "--disable-speech-api",
  "--disable-sync",
  "--hide-scrollbars",
  "--ignore-gpu-blacklist",
  "--metrics-recording-only",
  "--mute-audio",
  "--no-default-browser-check",
  "--no-first-run",
  "--no-pings",
  "--no-sandbox",
  "--no-zygote",
  "--password-store=basic",
  "--use-gl=swiftshader",
  "--use-mock-keychain",
  "--disable-accelerated-2d-canvas",
  "--disable-gpu"
]

const block_resources = [
  "image",
  "media ",
  "font",
  "texttrack",
  "eventsource",
  "manifest",
  "other"
]

export class Scrapper {
  page: Page

  async init() {
    const browser = await chromium.launch({ args })
    this.page = await browser.newPage({ viewport: { width: 375, height: 812 } })
    await this.page.route('**/*', (route) => {
      return block_resources.includes(route.request().resourceType())
        ? route.abort()
        : route.continue()
    })
    await this.page.goto("https://blaze.com/pt/games/double")
  }

  async getRedValue() {
    const total = await this.page.textContent("div.col-md-4.col-xs-12.margin-xs.left div.total")

    if (total === null) return null

    return Number(total.split(" ")[0])
  }

  async getBlackValue() {
    const total = await this.page.textContent("div.col-md-4.col-xs-12.right div.total")

    if (total === null) return null

    return Number(total.split(" ")[0])
  }

  async listen(callback: (white: boolean, win: boolean, redPercentage: number, blackPercentage: number) => void, onGraph: (red: number, black: number) => void) {
    this.page.exposeFunction("onGraph", onGraph)

    this.page.evaluate(() => {
      const red = document.querySelector("div.col-md-4.col-xs-12.margin-xs.left div.total > div:nth-child(1)")
      const black = document.querySelector("div.col-md-4.col-xs-12.right div.total > div:nth-child(1)")

      new MutationObserver(() => {
        const redNumber = Number(red!.textContent!.split(" ")[0])
        const blackNumber = Number(black!.textContent!.split(" ")[0])
        onGraph(redNumber, blackNumber)
      }).observe(red!, { characterData: true, childList: true, subtree: true })
    })

    while (true) {
      const element = await this.page.waitForSelector("div.time-left:text(\"Blaze Girou\")", { timeout: 60000 })
      const text = await element.textContent()
      const number = Number(text?.match(/\d+/)?.[0])

      const red = await this.getRedValue()
      const black = await this.getBlackValue()

      const [redPercentage, blackPercentage] = await this.page.evaluate(() => {
        const red = document.querySelector("div.col-md-4.col-xs-12.margin-xs.left div.total > div:nth-child(1)")
        const black = document.querySelector("div.col-md-4.col-xs-12.right div.total > div:nth-child(1)")

        const redNumber = Number(red!.textContent!.split(" ")[0])
        const blackNumber = Number(black!.textContent!.split(" ")[0])

        const redPercentage = redNumber / (redNumber + blackNumber) * 100
        const blackPercentage = blackNumber / (redNumber + blackNumber) * 100

        return [Number(redPercentage.toFixed(2)), Number(blackPercentage.toFixed(2))]
      })

      if (red && black) {
        let win = false
        let white = false

        if (number === 0) {
          white = true
          win = true
        } else if (red > black && number <= 7) {
          win = true
        } else if (red < black && number > 7) {
          win = true
        }

        callback(white, win, redPercentage, blackPercentage)
      }

      await this.page.waitForTimeout(10000)
    }
  }
}
