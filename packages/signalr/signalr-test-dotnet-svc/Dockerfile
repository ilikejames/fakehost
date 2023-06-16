FROM mcr.microsoft.com/dotnet/sdk:7.0

# Install Node.js
RUN apt-get update && apt-get install -y curl
RUN curl -sL https://deb.nodesource.com/setup_18.x | bash -
RUN apt-get install -y nodejs

RUN dotnet tool install --global TypedSignalR.Client.TypeScript.Generator
# ADD . /app

ENV PATH="/root/.dotnet/tools:${PATH}"
