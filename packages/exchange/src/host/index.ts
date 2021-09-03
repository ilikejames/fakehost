import * as Base from './BaseFakeHost';
import * as Response from './response';
export type FakeHost = Base.FakeHost;
export type SubscriptionHandler = Base.SubscriptionHandler<unknown, unknown>;
export type ServiceError = Response.ServiceError;
export * from './InlineFakeHost';
export * from './SockJsFakeHost';
export * from './WsFakeHost';
export type Connection = Base.Connection;
