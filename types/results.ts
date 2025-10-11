// types/results.ts
import type { ApiOk as ApiOkResponse, ApiErr as ApiErrResponse } from "./api";

export type ApiOk = ApiOkResponse;

export type ApiErr = ApiErrResponse;

export type ApiResult = ApiOk | ApiErr;
