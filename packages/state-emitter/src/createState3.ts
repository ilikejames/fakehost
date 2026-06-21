import { At, DotNotation } from './types'
import {
    EntityFactory as EntityFactory,
    EntityState,
    IdFactory as IdFactory,
    InitialState,
} from './EntityState'

type InitialState2<T extends object, TKey extends string> = T[] | Map<At<T, TKey>, T> | Set<T>

type TEntityFactory<
    T extends object,
    TKey extends string,
    TGenerator extends boolean,
    TState extends boolean,
> = TGenerator extends true
    ? never
    : {
          entityFactory: (
              factory: EntityFactory<T, TKey>,
          ) => TEntityStateBuilder<T, TKey, true, TState>
      }

type TEntityInitialState<
    T extends object,
    TKey extends string,
    TGenerator extends boolean,
    TState extends boolean,
> = TState extends true
    ? never
    : {
          initialState: (
              items: InitialState2<T, TKey>,
          ) => TEntityStateBuilder<T, TKey, TGenerator, true>
      }
type TEntityStateBuilder<
    T extends object,
    TKey extends string = DotNotation<T, keyof T>,
    TGenerator extends boolean = false,
    TState extends boolean = false,
> = {} & TEntityFactory<T, TKey, TGenerator, TState> &
    TEntityInitialState<T, TKey, TGenerator, TState>
