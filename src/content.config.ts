import { z, defineCollection } from "astro:content";

const guidesCollection = defineCollection({
  type: "content",
  schema: z.object({
    title: z.optional(z.string()),
  }),
});

const developerCollection = defineCollection({
  type: "content",
  schema: z.object({
    title: z.optional(z.string()),
  }),
});

const referenceCollection = defineCollection({
  type: "content",
  schema: z.object({
    title: z.optional(z.string()),
    relatedContents: z.optional(z.array(z.object({
      title: z.string(),
      url: z.string(),
    }))),
  }),
});

export const collections = {
  guides: guidesCollection,
  developer: developerCollection,
  reference: referenceCollection,
};
