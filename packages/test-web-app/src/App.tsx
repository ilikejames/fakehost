import { FC } from 'react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { CssBaseline } from '@mui/material'
import { Rest } from '@/components/Rest'
import { Signalr } from '@/components/Signalr'


const darkTheme = createTheme({
    palette: {
        mode: 'dark',
    }
})


export const App: FC = () => {

    return (
        <ThemeProvider theme={darkTheme}>
            <CssBaseline />
            <main>
                <Rest />
                <Signalr />
            </main>
        </ThemeProvider>
    )
}