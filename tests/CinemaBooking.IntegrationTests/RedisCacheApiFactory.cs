using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text.Encodings.Web;
using CinemaBooking.Modules.Booking.Infrastructure.Persistence;
using CinemaBooking.Modules.Booking.Infrastructure.Redis;
using CinemaBooking.Modules.Catalog.Infrastructure.Persistence;
using CinemaBooking.Modules.Identity.Application.Roles;
using CinemaBooking.Modules.Identity.Infrastructure.Authentication;
using CinemaBooking.Modules.Identity.Infrastructure.Persistence;
using CinemaBooking.Modules.Payment.Infrastructure.Persistence;
using CinemaBooking.Modules.Scheduling.Infrastructure.Persistence;
using CinemaBooking.Modules.Theater.Infrastructure.Persistence;
using CinemaBooking.Modules.Ticketing.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace CinemaBooking.IntegrationTests;

internal sealed class RedisCacheApiFactory : WebApplicationFactory<Program>
{
    private readonly string _databaseName = Guid.NewGuid().ToString("N");
    private readonly string _environmentName =
        $"Testing-{Guid.NewGuid():N}";
    private readonly string _redisConnectionString;

    public RedisCacheApiFactory(string redisConnectionString)
    {
        _redisConnectionString = redisConnectionString;
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment(_environmentName);

        builder.ConfigureAppConfiguration((_, configuration) =>
        {
            configuration.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:Database"] = "Server=(local);Database=CinemaBookingTests;",
                ["ConnectionStrings:Redis"] = _redisConnectionString,
                [$"{JwtOptions.SectionName}:Issuer"] = "CinemaBooking.Tests",
                [$"{JwtOptions.SectionName}:Audience"] = "CinemaBooking.Tests",
                [$"{JwtOptions.SectionName}:Key"] = "integration-test-jwt-key-with-enough-length",
                ["MovieImport:Moveek:BaseUrl"] = "https://example.test/",
                ["MovieImport:UserAgent"] = "CinemaBooking.Tests"
            });
        });

        builder.ConfigureTestServices(services =>
        {
            services.RemoveAll<IHostedService>();
            ReplaceDbContext<CatalogDbContext>(services);
            ReplaceDbContext<TheaterDbContext>(services);
            ReplaceDbContext<SchedulingDbContext>(services);
            ReplaceDbContext<BookingDbContext>(services);
            ReplaceDbContext<IdentityDbContext>(services);
            ReplaceDbContext<TicketingDbContext>(services);
            ReplaceDbContext<PaymentDbContext>(services);

            services.RemoveAll<IConnectionMultiplexer>();
            services.AddSingleton<IConnectionMultiplexer>(_ =>
                RedisConnectionFactory.Connect(_redisConnectionString));

            services
                .AddAuthentication(options =>
                {
                    options.DefaultAuthenticateScheme =
                        TestAuthenticationHandler.SchemeName;
                    options.DefaultChallengeScheme =
                        TestAuthenticationHandler.SchemeName;
                })
                .AddScheme<AuthenticationSchemeOptions, TestAuthenticationHandler>(
                    TestAuthenticationHandler.SchemeName,
                    _ => { });
        });
    }

    public static void AuthorizeAsAdmin(HttpClient client)
    {
        AuthorizeAs(client, AppRoles.Admin);
    }

    public static void AuthorizeAsStaff(HttpClient client)
    {
        AuthorizeAs(client, AppRoles.Staff);
    }

    public static void AuthorizeAs(
        HttpClient client,
        params string[] roles)
    {
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue(
                TestAuthenticationHandler.SchemeName,
                string.Join(' ', roles));
    }

    public async Task ExecuteScopeAsync(
        Func<IServiceProvider, Task> action)
    {
        using var scope = Services.CreateScope();

        await action(scope.ServiceProvider);
    }

    private void ReplaceDbContext<TDbContext>(IServiceCollection services)
        where TDbContext : DbContext
    {
        for (var index = services.Count - 1; index >= 0; index--)
        {
            var serviceType = services[index].ServiceType;

            if (serviceType == typeof(DbContextOptions) ||
                serviceType == typeof(DbContextOptions<TDbContext>) ||
                serviceType == typeof(TDbContext) ||
                IsDbContextOptionsConfiguration<TDbContext>(serviceType))
            {
                services.RemoveAt(index);
            }
        }

        services.AddDbContext<TDbContext>(options =>
        {
            options.UseInMemoryDatabase(_databaseName);
            options.ConfigureWarnings(warnings =>
                warnings.Ignore(InMemoryEventId.TransactionIgnoredWarning));
        });
    }

    private static bool IsDbContextOptionsConfiguration<TDbContext>(
        Type serviceType)
        where TDbContext : DbContext
    {
        return serviceType.IsGenericType &&
            serviceType.GetGenericTypeDefinition().FullName ==
            "Microsoft.EntityFrameworkCore.Infrastructure.IDbContextOptionsConfiguration`1" &&
            serviceType.GenericTypeArguments[0] == typeof(TDbContext);
    }

    private sealed class TestAuthenticationHandler :
        AuthenticationHandler<AuthenticationSchemeOptions>
    {
        public const string SchemeName = "Test";

        public TestAuthenticationHandler(
            IOptionsMonitor<AuthenticationSchemeOptions> options,
            ILoggerFactory logger,
            UrlEncoder encoder)
            : base(options, logger, encoder)
        {
        }

        protected override Task<AuthenticateResult> HandleAuthenticateAsync()
        {
            if (Request.Headers.Authorization.Count == 0)
            {
                return Task.FromResult(AuthenticateResult.NoResult());
            }

            var roles = Request.Headers.Authorization
                .SelectMany(value => value?.Split(' ', StringSplitOptions.RemoveEmptyEntries) ?? [])
                .Where(value => !string.Equals(value, SchemeName, StringComparison.OrdinalIgnoreCase))
                .DefaultIfEmpty(AppRoles.Admin)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToArray();

            var claims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString()),
                new(ClaimTypes.Email, "admin.integration@test.local")
            };

            claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

            var identity = new ClaimsIdentity(
                claims,
                SchemeName);
            var principal = new ClaimsPrincipal(identity);
            var ticket = new AuthenticationTicket(
                principal,
                SchemeName);

            return Task.FromResult(AuthenticateResult.Success(ticket));
        }
    }
}
