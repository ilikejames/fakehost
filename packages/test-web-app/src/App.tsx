import React, { FC, useMemo } from 'react'
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles'
import { CssBaseline } from '@mui/material'
import { Rest } from '@/components/Rest'
import { Signalr } from '@/components/Signalr'
import { ThemeProvider as EmotionThemeProvider, withTheme } from '@emotion/react'
import { darkTheme } from '@/theme'


export const App: FC = () => {

    const muiTheme = useMemo(() => createTheme({
        palette: {
            mode: 'dark',
        }
    }), [])

    return (
        <EmotionThemeProvider theme={darkTheme}>
            <MuiThemeProvider theme={muiTheme}>
                <CssBaseline />
                <Main />
            </MuiThemeProvider>
        </EmotionThemeProvider>
    )
}

const Main: FC = React.memo(() => {
    return (
        <main>
            <Rest />
            <Signalr />
        </main>
    )
})