cd ../signalr-svc
dotnet build
dotnet tsrts -p signalr-svc.csproj  --output ../signalr-test-api/src/generated