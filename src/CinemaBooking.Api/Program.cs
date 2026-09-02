using System.Text;
using CinemaBooking.Api.Authorization;
using CinemaBooking.Api.Database;
using CinemaBooking.Api.ExceptionHandling;
using CinemaBooking.Api.SeedData;
using CinemaBooking.Modules.Booking;
using CinemaBooking.Modules.Catalog;
using CinemaBooking.Modules.Identity;
using CinemaBooking.Modules.Identity.Infrastructure.Authentication;
using CinemaBooking.Modules.Identity.Infrastructure.Persistence;
using CinemaBooking.Modules.Payment;
using CinemaBooking.Modules.Scheduling;
using CinemaBooking.Modules.Ticketing;
using CinemaBooking.Modules.Theater;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.OpenApi;
using Microsoft.IdentityModel.Tokens;
using StackExchange.Redis;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme.",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    });

    options.AddSecurityRequirement(document => new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecuritySchemeReference("Bearer", document, null),
            []
        }
    });
});
builder.Services.AddCatalogModule(builder.Configuration);
builder.Services.AddTheaterModule(builder.Configuration);
builder.Services.AddSchedulingModule(builder.Configuration);
builder.Services.AddBookingModule(builder.Configuration);
builder.Services.AddTicketingModule(builder.Configuration);
builder.Services.AddPaymentModule(builder.Configuration);
builder.Services.AddIdentityModule(builder.Configuration);
builder.Services.AddScoped<CinemaManagementAuthorizer>();

var jwtOptions =
    builder.Configuration
        .GetSection(JwtOptions.SectionName)
        .Get<JwtOptions>()
    ?? throw new InvalidOperationException(
        "JWT configuration is missing.");

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters =
            new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = jwtOptions.Issuer,
                ValidAudience = jwtOptions.Audience,
                IssuerSigningKey =
                    new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(jwtOptions.Key)),
                ClockSkew = TimeSpan.Zero
            };
    });

builder.Services.AddAuthorization();
builder.Services
    .AddHealthChecks()
    .AddSqlServer(
        _ =>
            builder.Configuration.GetConnectionString("Database")
            ?? throw new InvalidOperationException(
                "Database connection string is missing."))
    .AddRedis(
        serviceProvider =>
            serviceProvider.GetRequiredService<IConnectionMultiplexer>(),
        name: "redis");

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    await app.ApplyMigrationsAsync();
}

await IdentitySeeder.SeedAsync(
    app.Services,
    builder.Configuration);

if (app.Environment.IsDevelopment())
{
    await DevelopmentDataSeeder.SeedAsync(app.Services);
}

app.UseExceptionHandler();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health");

app.Run();
