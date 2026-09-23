// Demo-safe api stub: mimics the real Convex codegen `api` object shape.
// Real codegen uses `anyApi` (a Proxy) so `api.apartments.list` is a
// FunctionReference carrying a functionName symbol. Our previous stub
// returned plain strings from nested Proxies, which made
// `useQuery(api.x.y, "skip")` throw "... is not a functionReference"
// because getFunctionName() couldn't resolve the path.
// This version returns proper objects with the functionName symbol
// (`convex/server` exports it as `functionName`), so skipped queries
// resolve names like "apartments:list" -> "apartments:list" without error.
import { anyApi } from "convex/server";

export const api: typeof anyApi = anyApi;

