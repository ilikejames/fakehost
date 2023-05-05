import { OrderStatus } from '@fakehost/signalr-test-client-api'
import { Circle, PanoramaFishEye, Tonality } from '@mui/icons-material'
import { useTheme } from '@emotion/react'
import styled from '@emotion/styled'
import React, { FC, CSSProperties } from 'react'
import { Theme } from '@/theme'

export const OrderStatusBadge: FC<{ status: OrderStatus }> = React.memo(({ status }) => {
    const theme = useTheme()
    const color = getColor(status, theme)!
    return <Badge colorStyle={color}>{getIcon(status)}{getLabel(status)}</Badge>
})

const Badge = styled.div<{ colorStyle: ColorStyle }>`
    align-items: flex-start;
    background-color: ${p => p.colorStyle.bg as string};
    border-radius: 22px;
    color: ${p => p.colorStyle.fg as string};
    display: inline-flex;
    flex-direction: row;
    gap: 4px;
    height: 22px;
    line-height: 18px;
    margin-top: 5px;
    padding: 2px 8px 0px 3px;
`

type ColorStyle = {
    bg: Required<CSSProperties['color']>
    fg: Required<CSSProperties['color']>
}

const getColor = (status: OrderStatus, theme: Theme): ColorStyle | undefined => {
    switch (status) {
        case OrderStatus.Open: return { fg: theme.accentPrimary.primary1, bg: theme.core.text }
        case OrderStatus.Partial: return { bg: theme.info.info4, fg: theme.info.info1 }
        case OrderStatus.Filled: return { bg: theme.accentPositive.positive4, fg: theme.accentPositive.positive1 }
        default:
            throwNever(status)
    }
}

const getLabel = (status: OrderStatus) => {
    switch (status) {
        case OrderStatus.Open: return 'Open'
        case OrderStatus.Partial: return 'Partially Filled'
        case OrderStatus.Filled: return 'Filled'
        default:
            throwNever(status)
    }
}

const getIcon = (status: OrderStatus) => {
    switch (status) {
        case OrderStatus.Open: return <PanoramaFishEye />
        case OrderStatus.Partial: return <Tonality />
        case OrderStatus.Filled: return <Circle />
        default:
            throwNever(status)
    }
}

const throwNever = (v: never) => {
    throw new Error(`Unexpected value: ${v}`)
}