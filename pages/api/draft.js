export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL is required" });

  try {
    // Fetch full article HTML server-side
    const articleRes = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!articleRes.ok) {
      return res.status(422).json({ error: `Could not fetch article (HTTP ${articleRes.status}). It may be behind a paywall.` });
    }

    const html = await articleRes.text();

    // Strip HTML tags to get clean readable text
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s{3,}/g, "\n\n")
      .trim()
      .substring(0, 15000);

    // Pass to Claude for structured extraction
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4000,
      system: `You are a news alert drafting assistant. Extract article details from scraped webpage text and return ONLY a raw JSON object with no markdown, no backticks, no explanation:
{"date":"Mon DD, YYYY","publication":"Publication Name","author":"Author Full Name or empty string","url":"article url","headline":"Full Article Headline","body":"Complete article body text with all paragraphs separated by newlines. Include any summary or key takeaway sections."}`,
      messages: [{
        role: "user",
        content: `Extract the article details and return JSON.\n\nURL: ${url}\n\nPAGE TEXT:\n${text}`,
      }],
    });

    const raw = message.content.filter(b => b.type === "text").map(b => b.text).join("");
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Could not parse article data.");

    const parsed = JSON.parse(jsonMatch[0]);
    return res.status(200).json(parsed);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || "Failed to process article." });
  }
}
