export const hadChildRoutes = [] as string[];

export const pages = ["/", "/chatgpt/"] as const;

export type PagePath = (typeof pages)[number];
