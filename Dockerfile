# syntax=docker/dockerfile:1

# --- Build stage ---
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Restore against the full solution (project references are simple; no central
# package management / global.json to copy).
COPY AltitudELog.slnx ./
COPY src/ ./src/
RUN dotnet restore src/AltitudELog.API/AltitudELog.API.csproj

# Publish a framework-dependent, self-contained-free build.
RUN dotnet publish src/AltitudELog.API/AltitudELog.API.csproj \
    -c Release -o /app/publish /p:UseAppHost=false

# --- Runtime stage ---
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish ./

# Railway routes to this port; the app also honours ASPNETCORE_URLS if set.
ENV ASPNETCORE_URLS=http://0.0.0.0:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "AltitudELog.API.dll"]
