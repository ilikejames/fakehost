import { HttpVerbs, QueryType, RequestHandler } from './types';
import { Path } from 'path-to-regexp';

export const register = <Q extends QueryType, B>(
    verb: HttpVerbs,
    path: Path,
    handler: RequestHandler<Q, B>,
) => {};

export const get = <Q extends QueryType>(path: Path, handler: RequestHandler<Q, undefined>) => {
    register(HttpVerbs.GET, path, handler);
};

export const post = <Q extends QueryType, Body>(path: Path, handler: RequestHandler<Q, Body>) => {
    register(HttpVerbs.POST, path, handler);
};

// Test impl

type LoginQuery = {
    q: string;
    s: string;
};

register<LoginQuery, {}>(HttpVerbs.GET, '/some/path', (req, res, err) => {
    const q = req.url.query.q;
    res.json({
        something: 'a',
    });
});

get<LoginQuery>('/home', (req, res, err) => {
    req.url.query.q;
    req.body;
    res.status(200, 'hello').send('hello').end();
});

post<LoginQuery, { hello: string }>('/post-body', (req, res, err) => {
    const p = req.body.hello;
    res.json({
        hello: p,
    });
    res.status(200);
});
