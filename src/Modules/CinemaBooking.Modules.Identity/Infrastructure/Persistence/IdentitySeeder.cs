using CinemaBooking.Modules.Identity.Application.Roles;
using CinemaBooking.Modules.Identity.Domain;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CinemaBooking.Modules.Identity.Infrastructure.Persistence;

public static class IdentitySeeder
{
    public static async Task SeedAsync(
        IServiceProvider services,
        IConfiguration configuration)
    {
        using var scope = services.CreateScope();

        var roleManager =
            scope.ServiceProvider
                .GetRequiredService<RoleManager<IdentityRole<Guid>>>();

        var userManager =
            scope.ServiceProvider
                .GetRequiredService<UserManager<ApplicationUser>>();

        await EnsureRoleAsync(roleManager, AppRoles.Customer);
        await EnsureRoleAsync(roleManager, AppRoles.Admin);
        await EnsureRoleAsync(roleManager, AppRoles.Staff);
        await EnsureAdminAsync(userManager, configuration);
        await EnsureStaffAsync(userManager, configuration);
    }

    private static async Task EnsureRoleAsync(
        RoleManager<IdentityRole<Guid>> roleManager,
        string role)
    {
        if (await roleManager.RoleExistsAsync(role))
        {
            return;
        }

        var result =
            await roleManager.CreateAsync(
                new IdentityRole<Guid>(role));

        if (!result.Succeeded)
        {
            throw new InvalidOperationException(
                BuildErrorMessage(result.Errors));
        }
    }

    private static async Task EnsureAdminAsync(
        UserManager<ApplicationUser> userManager,
        IConfiguration configuration)
    {
        var adminEmail =
            configuration["AdminSeed:Email"];

        var adminPassword =
            configuration["AdminSeed:Password"];

        if (string.IsNullOrWhiteSpace(adminEmail) ||
            string.IsNullOrWhiteSpace(adminPassword))
        {
            return;
        }

        adminEmail =
            adminEmail.Trim().ToLowerInvariant();

        var admin =
            await userManager.FindByEmailAsync(adminEmail);

        if (admin is null)
        {
            admin = new ApplicationUser
            {
                Id = Guid.NewGuid(),
                UserName = adminEmail,
                Email = adminEmail,
                EmailConfirmed = true,
                CreatedAt = DateTime.UtcNow
            };

            var result =
                await userManager.CreateAsync(
                    admin,
                    adminPassword);

            if (!result.Succeeded)
            {
                throw new InvalidOperationException(
                    BuildErrorMessage(result.Errors));
            }
        }

        if (await userManager.IsInRoleAsync(
            admin,
            AppRoles.Admin))
        {
            return;
        }

        var roleResult =
            await userManager.AddToRoleAsync(
                admin,
                AppRoles.Admin);

        if (!roleResult.Succeeded)
        {
            throw new InvalidOperationException(
                BuildErrorMessage(roleResult.Errors));
        }
    }

    private static async Task EnsureStaffAsync(
        UserManager<ApplicationUser> userManager,
        IConfiguration configuration)
    {
        var staffEmail =
            configuration["StaffSeed:Email"];

        var staffPassword =
            configuration["StaffSeed:Password"];

        if (string.IsNullOrWhiteSpace(staffEmail) ||
            string.IsNullOrWhiteSpace(staffPassword))
        {
            return;
        }

        staffEmail =
            staffEmail.Trim().ToLowerInvariant();

        var staff =
            await userManager.FindByEmailAsync(staffEmail);

        if (staff is null)
        {
            staff = new ApplicationUser
            {
                Id = Guid.NewGuid(),
                UserName = staffEmail,
                Email = staffEmail,
                EmailConfirmed = true,
                CreatedAt = DateTime.UtcNow
            };

            var result =
                await userManager.CreateAsync(
                    staff,
                    staffPassword);

            if (!result.Succeeded)
            {
                throw new InvalidOperationException(
                    BuildErrorMessage(result.Errors));
            }
        }

        if (await userManager.IsInRoleAsync(
            staff,
            AppRoles.Staff))
        {
            return;
        }

        var roleResult =
            await userManager.AddToRoleAsync(
                staff,
                AppRoles.Staff);

        if (!roleResult.Succeeded)
        {
            throw new InvalidOperationException(
                BuildErrorMessage(roleResult.Errors));
        }
    }

    private static string BuildErrorMessage(
        IEnumerable<IdentityError> errors)
    {
        return string.Join(
            "; ",
            errors.Select(error => error.Description));
    }
}
