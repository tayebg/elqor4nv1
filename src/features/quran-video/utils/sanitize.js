

export function sanitizeHTML(html) {
  if (!html || typeof html !== "string") return "";

  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    
    return doc.body.textContent?.replace(/\s+/g, " ").trim() || "";
  } catch {

    return html
      .replace(/<[^>]*>?/g, "")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/&#039;/gi, "'")
      .replace(/\s+/g, " ")
      .trim();
  }
}
