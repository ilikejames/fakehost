import { DotNotation } from './types'
import { EntityStateBuilder } from './EntityStateBuilder'

export const createEntityState = <T>() => {
    return {
        idField: <K extends DotNotation<T, keyof T>>(id: K): EntityStateBuilder<T, K> => {
            const entity = new EntityStateBuilder<T, K>(id)
            return entity
        },
    }
}
