import { CSSProperties } from 'react'

type Color = Required<CSSProperties['color']>

export type CustomTheme = {
    core: {
        base: Color
        core1: Color
        text: Color
    }
    accentPrimary: {
        base: Color
        primary1: Color
    }
    accentPositive: {
        base: Color
        positive1: Color
        positive2: Color
        positive3: Color
        positive4: Color
    }
    accentNegative: {
        base: Color
        negative1: Color
    }
    info: {
        base: Color
        info1: Color
        info2: Color
        info3: Color
        info4: Color
    }
}

declare module '@emotion/react' {
    export interface Theme extends CustomTheme {}
}
