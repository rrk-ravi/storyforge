import sanitizeHtml from "sanitize-html";

export const sanitizeStoryHtml = (value: string): string => {
  return sanitizeHtml(value, {
    allowedTags: [
      "p",
      "h1",
      "h2",
      "h3",
      "h4",
      "blockquote",
      "strong",
      "em",
      "u",
      "s",
      "ol",
      "ul",
      "li",
      "a",
      "code",
      "pre",
      "hr",
      "br"
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"]
    },
    allowedSchemes: ["http", "https", "mailto"]
  });
};

export const extractText = (value: string): string => {
  return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} }).trim();
};
