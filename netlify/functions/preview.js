import fetch from "node-fetch";
import cheerio from "cheerio";

export default async (req) => {
  const url = req.queryStringParameters.url;
  if (!url) {
    return { statusCode: 400, body: "URL requerida" };
  }

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "TelegramBot 1.0"
      }
    });

    const html = await res.text();
    const $ = cheerio.load(html);

    const image =
      $('meta[property="og:image"]').attr("content") ||
      $('meta[name="twitter:image"]').attr("content");

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image })
    };
  } catch (e) {
    return { statusCode: 500, body: "Error al generar preview" };
  }
};

