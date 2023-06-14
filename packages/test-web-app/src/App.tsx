import { FC, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles'
import { CssBaseline } from '@mui/material'
import { ThemeProvider as EmotionThemeProvider } from '@emotion/react'
import { darkTheme, useTheme, ThemeContext, ThemeMode, defaultTheme } from '@/theme'
import { Main } from '@/components/Main'


export const App: FC = () => {
    const [theme, setTheme] = useState<ThemeMode>(defaultTheme)

    const toggleTheme = () => {
        setTheme(theme === ThemeMode.Dark ? ThemeMode.Light : ThemeMode.Dark)
    }

    const muiTheme = useMemo(() => createTheme({
        palette: {
            mode: theme === ThemeMode.Dark ? 'dark' : 'light',
        }
    }), [theme])


    return (
        <ThemeContext.Provider value={[theme, toggleTheme]}>
            <EmotionThemeProvider theme={theme === ThemeMode.Dark ? darkTheme : darkTheme}>
                <MuiThemeProvider theme={muiTheme}>
                    <CssBaseline />
                    <Main />
                </MuiThemeProvider>
            </EmotionThemeProvider>
        </ThemeContext.Provider>
    )
}
