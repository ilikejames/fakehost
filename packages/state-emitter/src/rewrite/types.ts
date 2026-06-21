import { _ } from 'vitest/dist/types-198fd1d9'

export type DeepPartial<T> = T extends object
    ? {
          [P in keyof T]?: DeepPartial<T[P]>
      }
    : T

type RemoveUndefined<T> = T extends undefined ? never : T

/**
 * Get all possible dot notation paths for a given type, with a maximum depth.
 */
export type DotNotationPaths<T, Depth extends number = 5> = RemoveUndefined<
    _DotNotationPaths<T, Depth>
>

type _DotNotationPaths<T, Depth extends number = 5, Prefix extends string = ''> = Depth extends 0
    ? never
    : T extends Record<string, any>
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
    : N extends 1
    ? 0
    : 0

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

/**
 * TODO: What does this do?
 */
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

export type Prettify<T> = {
    [K in keyof T]: T[K] extends object ? Prettify<T[K]> & EmptyObject : T[K]
} & EmptyObject
