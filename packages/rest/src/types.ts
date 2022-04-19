import URLParse from 'url-parse';
import { Path } from 'path-to-regexp';

export enum HttpVerbs {
    GET = 'GET',
    HEAD = 'HEAD',
    POST = 'POST',
    PUT = 'PUT',
    DELETE = 'DELETE',
    CONNECT = 'CONNECT',
    OPTIONS = 'OPTIONS',
}

export type QueryType = Record<string, string | undefined>;

export type Response = {
    status: (code: number, message?: string) => Response;
    send: (s: string) => Response;
    json: (payload: unknown) => void;
    end: () => void;
    redirect: (path: string) => void;
};

export type RequestHandler<Query extends QueryType, JsonBody> = (
    req: Request<Query, JsonBody>,
    res: Response,
    err?: (err: ErrorResponse) => void,
) => void;

export type Request<Query extends QueryType, JsonBody> = {
    method: HttpVerbs;
    url: URLParse<Query>;
    body: JsonBody;
    contentType: string;
};

export type ErrorResponse = {
    code: number;
    message: string;
};
