import collector from 'cypress-terminal-report/src/installLogsCollector'
collector({
    enableContinuousLogging: true,
    collectTypes: ['cons:log', 'cons:info', 'cons:warn', 'cons:error', 'cy:log'],
})

export {}
