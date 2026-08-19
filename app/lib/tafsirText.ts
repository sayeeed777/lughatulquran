export const cleanTafsirText = (input: string) => {
  let text = input.replace(/\r\n?/g, "\n").replace(/[\u2028\u2029]/g, "\n");
  text = text.replace(/(\p{L})\uFFFD(\p{L})/gu, "$1$2");
  text = text.replace(/\uFFFD+/gu, " ");
  text = text.replace(/[^\S\n]+/g, " ");
  text = text.replace(/ *\n */g, "\n");
  text = text.replace(/\n{3,}/g, "\n\n");
  return text.trim();
};

export const splitTafsirParagraphs = (input: string) =>
  cleanTafsirText(input)
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

export const getTafsirParagraphDirection = (
  paragraph: string,
  editionDirection: "ltr" | "rtl"
) => {
  if (editionDirection === "rtl") return "rtl";

  const letters = paragraph.match(/\p{L}/gu) || [];
  if (letters.length === 0) return editionDirection;

  const arabicLetters = paragraph.match(/\p{Script=Arabic}/gu) || [];
  return arabicLetters.length / letters.length >= 0.75 ? "rtl" : editionDirection;
};
