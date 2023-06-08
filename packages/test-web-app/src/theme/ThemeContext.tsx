import React, { createContext } from 'react'

export enum ThemeMode {
    Dark = 'dark',
    Light = 'light',
}

const getTheme = (s?: string | null): ThemeMode => {
    switch (s) {
        case 'light':
            return ThemeMode.Light
        default:
            return ThemeMode.Dark
    }
}

export const defaultTheme = getTheme(localStorage.getItem('data.theme'))

export const ThemeContext = createContext<[ThemeMode, () => void] | null>(null)

export const useTheme = () => React.useContext(ThemeContext)

