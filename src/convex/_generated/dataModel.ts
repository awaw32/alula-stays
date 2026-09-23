// Demo-safe stub
export type Id<TableName extends string = string> = string;
export type Doc<T extends string = string> = Record<string, unknown> & { _id: string };
export type TableNames = string;
