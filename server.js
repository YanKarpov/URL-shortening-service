const express = require("express");
const { createClient } = require("redis");
const path = require("path");

const app = express();
const port = 3000;

const redisClient = createClient({
  url: "redis://my_redis:6379",
});

redisClient.on("error", (err) => {
  console.error("Ошибка подключения к Redis:", err);
});

(async () => {
  try {
    await redisClient.connect();
    console.log("Подключено к Redis");
  } catch (err) {
    console.error("Ошибка при подключении к Redis:", err);
    process.exit(1);
  }
})();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));

function generateShortUrl() {
    const now = new Date();
    const localDate = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Moscow" }));
    const date = localDate.toISOString().split('T')[0].replace(/-/g, ''); 
    const time = localDate.getHours().toString().padStart(2, '0') + localDate.getMinutes().toString().padStart(2, '0'); 
    return date + '-' + time;
  }
  
  
app.get("/", (req, res) => {
  res.render("index");
});

app.post("/create", async (req, res) => {
  const originalUrl = req.body.url;

  if (!originalUrl) {
    return res.status(400).send("URL не указан");
  }

  const shortUrl = generateShortUrl();

  try {
    await redisClient.set(shortUrl, originalUrl);
    res.render("final", { shortUrl, originalUrl });
  } catch (err) {
    console.error("Ошибка при сохранении URL:", err);
    res.status(500).send("Ошибка сервера");
  }
});

app.get("/:shortUrl", async (req, res) => {
  const shortUrl = req.params.shortUrl;

  try {
    const originalUrl = await redisClient.get(shortUrl);

    if (!originalUrl) {
      return res.status(404).send("Сокращённый URL не найден");
    }

    res.redirect(originalUrl);
  } catch (err) {
    console.error("Ошибка при обработке запроса:", err);
    res.status(500).send("Ошибка сервера");
  }
});

app.listen(port, () => {
  console.log(`Сервис сокращения URL запущен на http://localhost:${port}`);
});
