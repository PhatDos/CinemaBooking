using CinemaBooking.Modules.Identity.Application.Roles;
using CinemaBooking.Modules.Identity.Contracts;
using CinemaBooking.Modules.Identity.Domain;
using CinemaBooking.Modules.Identity.Infrastructure.Persistence;
using CinemaBooking.SharedKernel.Exceptions;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace CinemaBooking.Modules.Identity.Application;

public sealed class IdentityModule : IIdentityModule
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IdentityDbContext _dbContext;

    public IdentityModule(
        UserManager<ApplicationUser> userManager,
        IdentityDbContext dbContext)
    {
        _userManager = userManager;
        _dbContext = dbContext;
    }

    public async Task AddToStaffRoleAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var user = await FindUserAsync(userId);

        if (await _userManager.IsInRoleAsync(user, AppRoles.Staff))
        {
            return;
        }

        var result =
            await _userManager.AddToRoleAsync(user, AppRoles.Staff);

        if (!result.Succeeded)
        {
            throw new BusinessRuleException(
                BuildErrorMessage(result.Errors));
        }
    }

    public async Task AssignStaffToCinemaAsync(
        Guid userId,
        Guid cinemaId,
        CancellationToken cancellationToken = default)
    {
        var user = await FindUserAsync(userId);

        if (!await _userManager.IsInRoleAsync(user, AppRoles.Staff))
        {
            throw new BusinessRuleException(
                "User must have Staff role.");
        }

        var alreadyAssigned =
            await _dbContext.StaffCinemaAssignments
                .AnyAsync(
                    assignment =>
                        assignment.UserId == userId &&
                        assignment.CinemaId == cinemaId,
                    cancellationToken);

        if (alreadyAssigned)
        {
            return;
        }

        _dbContext.StaffCinemaAssignments.Add(
            new StaffCinemaAssignment
            {
                UserId = userId,
                CinemaId = cinemaId
            });

        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<bool> IsStaffOfCinemaAsync(
        Guid userId,
        Guid cinemaId,
        CancellationToken cancellationToken = default)
    {
        return await _dbContext.StaffCinemaAssignments
            .AsNoTracking()
            .AnyAsync(
                assignment =>
                    assignment.UserId == userId &&
                    assignment.CinemaId == cinemaId,
                cancellationToken);
    }

    public async Task<IReadOnlyList<Guid>> GetAssignedCinemaIdsAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        await FindUserAsync(userId);

        return await _dbContext.StaffCinemaAssignments
            .AsNoTracking()
            .Where(assignment => assignment.UserId == userId)
            .OrderBy(assignment => assignment.CreatedAt)
            .Select(assignment => assignment.CinemaId)
            .ToListAsync(cancellationToken);
    }

    private async Task<ApplicationUser> FindUserAsync(
        Guid userId)
    {
        var user =
            await _userManager.FindByIdAsync(userId.ToString());

        if (user is null)
        {
            throw new NotFoundException("User was not found.");
        }

        return user;
    }

    private static string BuildErrorMessage(
        IEnumerable<IdentityError> errors)
    {
        return string.Join(
            "; ",
            errors.Select(error => error.Description));
    }
}
