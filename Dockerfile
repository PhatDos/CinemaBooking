FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["CinemaBooking.slnx", "./"]

COPY ["src/CinemaBooking.Api/CinemaBooking.Api.csproj", "src/CinemaBooking.Api/"]
COPY ["src/CinemaBooking.SharedKernel/CinemaBooking.SharedKernel.csproj", "src/CinemaBooking.SharedKernel/"]

COPY ["src/Modules/CinemaBooking.Modules.Catalog/CinemaBooking.Modules.Catalog.csproj", "src/Modules/CinemaBooking.Modules.Catalog/"]
COPY ["src/Modules/CinemaBooking.Modules.Theater/CinemaBooking.Modules.Theater.csproj", "src/Modules/CinemaBooking.Modules.Theater/"]
COPY ["src/Modules/CinemaBooking.Modules.Scheduling/CinemaBooking.Modules.Scheduling.csproj", "src/Modules/CinemaBooking.Modules.Scheduling/"]
COPY ["src/Modules/CinemaBooking.Modules.Booking/CinemaBooking.Modules.Booking.csproj", "src/Modules/CinemaBooking.Modules.Booking/"]
COPY ["src/Modules/CinemaBooking.Modules.Identity/CinemaBooking.Modules.Identity.csproj", "src/Modules/CinemaBooking.Modules.Identity/"]
COPY ["src/Modules/CinemaBooking.Modules.Payment/CinemaBooking.Modules.Payment.csproj", "src/Modules/CinemaBooking.Modules.Payment/"]

RUN dotnet restore "src/CinemaBooking.Api/CinemaBooking.Api.csproj"

COPY . .

RUN dotnet publish "src/CinemaBooking.Api/CinemaBooking.Api.csproj" \
    -c Release \
    -o /app/publish \
    /p:UseAppHost=false

FROM base AS final
WORKDIR /app

COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "CinemaBooking.Api.dll"]
