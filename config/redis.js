const { createClient } = require("redis");

const redisClient = createClient({
  url: "redis://my_redis:6379",
});

redisClient.on("error", (err) => {
  console.error("Ошибка подключения к Redis:", err);
});

(async () => {
  try {
    await redisClient.connect();
    console.log("✅ Подключено к Redis");
  } catch (err) {
    console.error("❌ Ошибка при подключении к Redis:", err);
    process.exit(1);
  }
})();

module.exports = redisClient;
