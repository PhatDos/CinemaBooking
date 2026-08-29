using CinemaBooking.Modules.Identity.Application.Interfaces;
using CinemaBooking.Modules.Identity.Application.Roles;
using CinemaBooking.Modules.Identity.Domain;
using CinemaBooking.Modules.Identity.Infrastructure.Persistence;
using CinemaBooking.SharedKernel.Exceptions;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace CinemaBooking.Modules.Identity.Application.Auth;

public class AuthService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly IJwtTokenGenerator _jwt;
    private readonly IdentityDbContext _dbContext;

    public AuthService(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        IJwtTokenGenerator jwt,
        IdentityDbContext dbContext)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _jwt = jwt;
        _dbContext = dbContext;
    }

    public async Task<AuthResponse> RegisterAsync(
        RegisterRequest request)
    {
        var email =
            request.Email.Trim().ToLowerInvariant();

        var existing =
            await _userManager.FindByEmailAsync(email);

        if (existing is not null)
        {
            throw new ConflictException(
                "Email is already registered.");
        }

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = email,
            Email = email,
            CreatedAt = DateTime.UtcNow
        };

        var result =
            await _userManager.CreateAsync(
                user,
                request.Password);

        if (!result.Succeeded)
        {
            var errors = string.Join(
                "; ",
                result.Errors.Select(error => error.Description));

            throw new BusinessRuleException(errors);
        }

        var roleResult =
            await _userManager.AddToRoleAsync(
                user,
                AppRoles.Customer);

        if (!roleResult.Succeeded)
        {
            var errors = string.Join(
                "; ",
                roleResult.Errors.Select(error => error.Description));

            throw new BusinessRuleException(errors);
        }

        return await CreateAuthResponseAsync(user);
    }

    public async Task<AuthResponse> LoginAsync(
        LoginRequest request)
    {
        var email =
            request.Email.Trim().ToLowerInvariant();

        var user =
            await _userManager.FindByEmailAsync(email);

        if (user is null)
        {
            throw new BusinessRuleException(
                "Invalid email or password.");
        }

        var result =
            await _signInManager.CheckPasswordSignInAsync(
                user,
                request.Password,
                lockoutOnFailure: false);

        if (!result.Succeeded)
        {
            throw new BusinessRuleException(
                "Invalid email or password.");
        }

        return await CreateAuthResponseAsync(user);
    }

    public async Task<AuthResponse> RefreshAsync(
        RefreshTokenRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            throw new BusinessRuleException("Refresh token is required.");
        }

        var tokenHash =
            RefreshTokenGenerator.Hash(request.RefreshToken);

        var storedToken =
            await _dbContext.RefreshTokens
                .Include(token => token.User)
                .FirstOrDefaultAsync(token =>
                    token.TokenHash == tokenHash);

        if (storedToken is null)
        {
            throw new BusinessRuleException(
                "Invalid refresh token.");
        }

        if (storedToken.RevokedAt is not null)
        {
            throw new BusinessRuleException(
                "Refresh token has been revoked.");
        }

        if (storedToken.ExpiresAt <= DateTime.UtcNow)
        {
            throw new BusinessRuleException(
                "Refresh token has expired.");
        }

        storedToken.RevokedAt = DateTime.UtcNow;

        var newRefreshToken =
            await CreateRefreshTokenAsync(
                storedToken.User,
                saveChanges: false);

        await _dbContext.SaveChangesAsync();

        return new AuthResponse
        {
            UserId = storedToken.User.Id,
            Email = storedToken.User.Email!,
            AccessToken = await _jwt.GenerateAsync(storedToken.User),
            RefreshToken = newRefreshToken
        };
    }

    public async Task LogoutAsync(
        Guid userId,
        LogoutRequest request)
    {
        if (userId == Guid.Empty)
        {
            throw new BusinessRuleException("User id is required.");
        }

        if (string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            return;
        }

        var tokenHash =
            RefreshTokenGenerator.Hash(request.RefreshToken);

        var token =
            await _dbContext.RefreshTokens
                .FirstOrDefaultAsync(item =>
                    item.TokenHash == tokenHash &&
                    item.UserId == userId);

        if (token is null ||
            token.RevokedAt is not null)
        {
            return;
        }

        token.RevokedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();
    }

    private async Task<AuthResponse> CreateAuthResponseAsync(
        ApplicationUser user)
    {
        return new AuthResponse
        {
            UserId = user.Id,
            Email = user.Email!,
            AccessToken = await _jwt.GenerateAsync(user),
            RefreshToken = await CreateRefreshTokenAsync(user)
        };
    }

    private async Task<string> CreateRefreshTokenAsync(
        ApplicationUser user,
        bool saveChanges = true)
    {
        var rawToken = RefreshTokenGenerator.Generate();
        var now = DateTime.UtcNow;

        var refreshToken = new RefreshToken
        {
            UserId = user.Id,
            TokenHash = RefreshTokenGenerator.Hash(rawToken),
            CreatedAt = now,
            ExpiresAt = now.AddDays(7)
        };

        _dbContext.RefreshTokens.Add(refreshToken);

        if (saveChanges)
        {
            await _dbContext.SaveChangesAsync();
        }

        return rawToken;
    }
}
