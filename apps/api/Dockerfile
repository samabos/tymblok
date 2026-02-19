# Build stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy solution and project files first for layer caching
COPY Tymblok.sln ./
COPY src/Tymblok.Api/Tymblok.Api.csproj src/Tymblok.Api/
COPY src/Tymblok.Core/Tymblok.Core.csproj src/Tymblok.Core/
COPY src/Tymblok.Infrastructure/Tymblok.Infrastructure.csproj src/Tymblok.Infrastructure/
COPY src/Tymblok.Shared/Tymblok.Shared.csproj src/Tymblok.Shared/

# Copy test projects if they exist
COPY tests/Tymblok.Api.Tests/Tymblok.Api.Tests.csproj tests/Tymblok.Api.Tests/
COPY tests/Tymblok.Infrastructure.Tests/Tymblok.Infrastructure.Tests.csproj tests/Tymblok.Infrastructure.Tests/

# Restore dependencies
RUN dotnet restore

# Copy everything else
COPY . .

# Build and publish
RUN dotnet publish src/Tymblok.Api/Tymblok.Api.csproj -c Release -o /app/publish --no-restore

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

# Create non-root user
RUN groupadd -r tymblok && useradd -r -g tymblok tymblok

COPY --from=build /app/publish .

# Set environment
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

EXPOSE 8080

USER tymblok

ENTRYPOINT ["dotnet", "Tymblok.Api.dll"]
