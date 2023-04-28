export type DeepPartial<T> = T extends object
    ? {
          [P in keyof T]?: DeepPartial<T[P]>
      }
    : T

export type DotNotation<T, K extends keyof T> = K extends string
    ? T[K] extends object
        ? `${string & K}.${DotNotation<T[K], keyof T[K]>}` | `${string & K}`
        : `${string & K}`
    : never

export type At<T, K extends string> = K extends keyof T
    ? T[K]
    : K extends `${infer F}.${infer R}`
    ? F extends keyof T
        ? At<T[F], R>
        : never
    : never

// eslint-disable-next-line @typescript-eslint/ban-types
type EmptyObject = {}

type Prettify<T> = {
    [K in keyof T]: T[K] extends object ? Prettify<T[K]> & EmptyObject : T[K]
} & EmptyObject

export type PickFromDotNotation<T, Path extends string> = Path extends `${infer Key}.${infer Rest}`
    ? Key extends keyof T
        ? { [K in Key]: PickFromDotNotation<T[K], Rest> }
        : never
    : Path extends keyof T
    ? Prettify<Pick<T, Path>>
    : never

export type RequiredFromDotNotation<T, Path extends string> = Prettify<
    DeepPartial<T> & PickFromDotNotation<T, Path>
> &
    EmptyObject
