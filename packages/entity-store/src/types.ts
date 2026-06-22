export type DeepPartial<T> = T extends object
    ? { [P in keyof T]?: DeepPartial<T[P]> }
    : T

/**
 * All valid dot-notation paths for T (e.g. 'id', 'payload.orderId').
 * Depth is capped at 5 to avoid infinite recursion on circular types.
 */
export type DotNotationPaths<T, Depth extends number = 5> = _DotNotationPaths<T, Depth>

type _DotNotationPaths<
    T,
    Depth extends number = 5,
    Prefix extends string = '',
> = Depth extends 0
    ? never
    : T extends Record<string, unknown>
    ? {
          [K in keyof T]: K extends string
              ?
                    | `${Prefix}${Prefix extends '' ? '' : '.'}${K}`
                    | _DotNotationPaths<
                          T[K],
                          Decrement<Depth>,
                          `${Prefix}${Prefix extends '' ? '' : '.'}${K}`
                      >
              : never
      }[keyof T]
    : never

type Decrement<N extends number> = N extends 5
    ? 4
    : N extends 4
    ? 3
    : N extends 3
    ? 2
    : N extends 2
    ? 1
    : 0

/** Resolve the type at a dot-notation path within T. */
export type At<T, K extends string> = K extends keyof T
    ? T[K]
    : K extends `${infer F}.${infer R}`
    ? F extends keyof T
        ? At<T[F], R>
        : never
    : never

// eslint-disable-next-line @typescript-eslint/ban-types
type EmptyObject = {}

export type Prettify<T> = { [K in keyof T]: T[K] } & EmptyObject

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
