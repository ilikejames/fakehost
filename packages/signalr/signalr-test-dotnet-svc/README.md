# SignalRTest

A SignalR dotnet application. This is an implementation using the real SignalR protocol 
to run contact tests against. 

Ported from https://github.com/nenoNaninu/TypedSignalR.Client.TypeScript


## Running locally

```sh
dotnet run --urls=http://localhost:5001/
```

## Generate typescript definition

```sh
dotnet tsrts -p signalr-test-app2.csproj  --output generated
```


