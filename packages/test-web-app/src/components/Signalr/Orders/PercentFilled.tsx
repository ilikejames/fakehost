import React, { FC } from 'react'
import styled from '@emotion/styled'

export const PercentFilled: FC<{ value: number }> = React.memo(({ value }) => {

    const style: React.CSSProperties = {
        transform: `translateX(${(100 - value!) * -1}%)`
    }

    return (
        <Progress role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
            <Bar style={style}></Bar>
        </Progress>
    )
})

const Progress = styled.span`
    background: ${props => props.theme.accentPrimary.base?.toString()};
    border-radius: 15px;
    display: block;
    height: 4px;
    margin-top: 14px;
    overflow: hidden;
    position: relative;
    width: 125px;
    z-index: 0;
`

const Bar = styled.span`
    background: ${props => props.theme.accentPositive.positive4?.toString()};
    border-radius: 15px;
    bottom: 0;
    left: 0;
    position: absolute;
    top: 0;
    transform-origin: left;
    width: 100%;
`