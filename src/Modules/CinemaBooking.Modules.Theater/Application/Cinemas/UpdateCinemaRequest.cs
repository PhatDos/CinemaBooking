using System.ComponentModel.DataAnnotations;

namespace CinemaBooking.Modules.Theater.Application.Cinemas;

public sealed record UpdateCinemaRequest(
    [Required]
    [MaxLength(200)]
    string Name,

    [Required]
    [MaxLength(500)]
    string Address,

    [Required]
    [MaxLength(100)]
    string City,

    [MaxLength(1000)]
    string? Description,

    [MaxLength(1000)]
    string? ImageUrl,

    bool IsActive,

    [MaxLength(20)]
    string? ProvinceCode = null,

    [MaxLength(100)]
    string? ProvinceName = null,

    [MaxLength(20)]
    string? WardCode = null,

    [MaxLength(100)]
    string? WardName = null,

    [MaxLength(500)]
    string? AddressLine = null);
