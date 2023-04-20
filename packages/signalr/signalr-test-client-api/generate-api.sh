cd ../signalr-test-dotnet-svc
dotnet build
dotnet tsrts -p signalr-svc.csproj  --output ../signalr-test-client-api/src/generated
