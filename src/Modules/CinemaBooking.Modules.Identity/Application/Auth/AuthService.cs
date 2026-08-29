using CinemaBooking.Modules.Identity.Application.Interfaces;
using CinemaBooking.Modules.Identity.Domain;
using CinemaBooking.SharedKernel.Exceptions;
using Microsoft.AspNetCore.Identity;

namespace CinemaBooking.Modules.Identity.Application.Auth;

public class AuthService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly IJwtTokenGenerator _jwt;

    public AuthService(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        IJwtTokenGenerator jwt)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _jwt = jwt;
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

        return new AuthResponse
        {
            UserId = user.Id,
            Email = user.Email!,
            AccessToken =
                await _jwt.GenerateAsync(user)
        };
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

        return new AuthResponse
        {
            UserId = user.Id,
            Email = user.Email!,
            AccessToken =
                await _jwt.GenerateAsync(user)
        };
    }
}
