import styled from '@emotion/styled'
import { Order, OrderStatus } from '@fakehost/signalr-test-client-api'
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    useReactTable
} from '@tanstack/react-table'
import { Subscribe } from '@react-rxjs/core'
import React, { FC } from 'react'
import { useVirtual } from 'react-virtual'
import { orders$, useOrders } from '@/api/orders'
import { OrderStatusBadge } from './OrderStatusBadge'
import { PercentFilled } from './PercentFilled'

export const OrderGrid: FC = () => {
    return (
        <Subscribe source$={orders$()} fallback={'Loading...'}>
            <OrderGridComponent />
        </Subscribe>
    )
}

const OrderGridComponent: FC = () => {
    const orders = useOrders()
    const table = useReactTable({
        data: orders,
        columns,
        getCoreRowModel: getCoreRowModel<Order>(),
        getSortedRowModel: getSortedRowModel<Order>(),
        debugTable: false,
        state: {
            sorting: [{ id: 'orderId', desc: true }]
        }
    })
    const tableContainerRef = React.useRef<HTMLDivElement>(null)
    const { rows } = table.getRowModel()
    const rowVirtualizer = useVirtual({
        parentRef: tableContainerRef,
        size: rows.length,
        overscan: 10,
    })
    const { virtualItems: virtualRows, totalSize } = rowVirtualizer

    const paddingTop = virtualRows[0]?.start ?? 0
    const paddingBottom = virtualRows.length ? totalSize - (virtualRows.at(-1)?.end ?? 0) : 0

    return (
        <Container ref={tableContainerRef}>
            <Table>
                <THead>
                    {table.getHeaderGroups().map(headerGroup => (
                        <tr key={headerGroup.id}>
                            {headerGroup.headers.map(header => (
                                <th key={header.id} data-colid={header.column.id} colSpan={header.colSpan} style={{ width: header.getSize() }}>{header.column.columnDef.header as string || ''}</th>
                            ))}
                        </tr>
                    ))}
                </THead>
                <TBody>
                    {paddingTop > 0 && (
                        <tr role="presentation">
                            <td style={{ height: `${paddingTop}px` }} />
                        </tr>
                    )}
                    {virtualRows.map(virtualRow => {
                        const row = rows[virtualRow.index]
                        return (
                            <tr aria-rowindex={row.index} key={row.id}>
                                {row.getVisibleCells().map(cell => {
                                    return (
                                        <td data-colid={cell.column.id} key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </td>
                                    )
                                })}
                            </tr>
                        )
                    })}
                    {paddingBottom > 0 && (
                        <tr role="presentation">
                            <td style={{ height: `${paddingBottom}px` }} />
                        </tr>
                    )}
                </TBody>
            </Table>
        </Container>
    )
}

const columns: ColumnDef<Order>[] = [
    {
        accessorKey: 'orderId',
        header: 'Order Id',
        size: 100,
    },
    {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <OrderStatusBadge status={row.getValue<OrderStatus>('status')} />
    },
    {
        accessorKey: 'symbol',
        header: 'Symbol',
    },
    {
        accessorKey: 'price',
        header: 'Price',
    },
    {
        accessorKey: 'totalQuantity',
        header: 'Total Qty',
    },
    {
        accessorKey: 'filledQuantity',
        header: 'Filled Qty',
    },
    {
        header: 'Percent Filled',
        cell: ({ row }) => {
            const filled = row.getValue<Order['filledQuantity']>('filledQuantity')
            const total = row.getValue<Order['totalQuantity']>('totalQuantity')
            return <PercentFilled value={Math.round(filled / total * 100)} />
        }
    }
]

const Container = styled.div`
    height: 500px;
    overflow: auto;
    border-radius: 4px;
    border: solid 1px ${props => props.theme.core.core1?.toString()};
    width: 100%;
`

const Table = styled.table`
    table-layout: fixed;
    width: 100%;
    border-spacing: 0;
`

const THead = styled.thead`
    position: sticky;
    top: 0;
    z-index: 1;
    & > tr > th {
        text-align: left;
        padding: 2px 8px;
        height: 60px;
        background: ${props => props.theme.core.base?.toString()}
    }

    & th[data-colid=orderId], th[data-colid=price], th[data-colid=totalQuantity], th[data-colid=filledQuantity] {
        text-align: right
    }

`

const TBody = styled.tbody`
    & tr td {
        border-bottom: solid 1px ${props => props.theme.core.base?.toString()};
    }
    & td {
        padding: 2px 8px
    }
    & td[data-colid=orderId], td[data-colid=price], td[data-colid=totalQuantity], td[data-colid=filledQuantity] {
        text-align: right
    }
`
