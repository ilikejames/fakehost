import { FakeSignalrHub, ConnectionId } from '@fakehost/signalr'
import { IChatHub, IChatReceiver } from '@fakehost/signalr-test-client-api'

type Username = string & { __username: never }

const members = new Map<Username, ConnectionId>()

type ConnectionState = {
    username: Username
}

const chatHub = new FakeSignalrHub<IChatHub, IChatReceiver, ConnectionState>(
    '/chathub',
    {
        onJoin: true,
        onLeave: true,
        onReceiveMessage: true,
    },
    'capitalize',
)

const join: IChatHub['join'] = async function (this: typeof chatHub.thisInstance, username) {
    const user = username as Username

    members.set(user, this.Connection.id)

    this.Connection.setState('username', user)
    this.Clients.All.onJoin(username, new Date())

    this.Connection.addEventHandler('disconnect', () => {
        if (members.has(user)) {
            members.delete(user)
            this.Clients.All.onLeave(username, new Date())
        }
    })
}

const leave: IChatHub['leave'] = async function (this: typeof chatHub.thisInstance) {
    const username = this.Connection.getState('username')
    if (username) {
        members.delete(username)
        this.Clients.All.onLeave(username, new Date())
    }
}

const getParticipants: IChatHub['getParticipants'] = async () => {
    const result = Array.from(members.keys())
    return result
}

const alwaysThrows: IChatHub['alwaysThrows'] = async () => {
    throw new Error(`An unexpected error occurred invoking 'AlwaysThrows' on the server.`)
}

chatHub.register('getParticipants', getParticipants)
chatHub.register('join', join)
chatHub.register('leave', leave)
chatHub.register('alwaysThrows', alwaysThrows)

export { chatHub }
