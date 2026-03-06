import { prisma } from "../config/prisma.js";

const normalizeSlug = (value: string): string => {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replaceAll(/[^a-z0-9\s-]/g, "")
    .trim()
    .replaceAll(/\s+/g, "-")
    .replaceAll(/-+/g, "-")
    .replaceAll(/^-|-$/g, "");
};

export const createUniqueStorySlug = async (title: string, currentId?: string): Promise<string> => {
  const base = normalizeSlug(title) || "story";

  let candidate = base;
  let suffix = 2;

  while (true) {
    const existing = await prisma.story.findFirst({
      where: {
        slug: candidate,
        ...(currentId ? { NOT: { id: currentId } } : {})
      },
      select: { id: true }
    });

    if (!existing) {
      return candidate;
    }

    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
};
