import chalk from 'chalk'

export const log = {
    when: (...args: any[]) => console.log(...args.map(x => chalk.white.italic(x))),
    then: (...args: any[]) => console.log(...args.map(x => chalk.white(x))),
    success: (...args: any[]) => console.log(...args.map(x => chalk.green(x))),
    debug: (...args: any[]) => console.log(...args.map(x => chalk.white.dim(x))),
    data: (...args: any[]) =>
        console.log(...args.map(x => chalk.yellow(typeof x === 'object' ? JSON.stringify(x) : x))),
}
