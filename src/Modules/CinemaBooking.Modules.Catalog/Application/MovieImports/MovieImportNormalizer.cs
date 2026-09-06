using System.Globalization;
using System.Security.Cryptography;
using System.Text;

namespace CinemaBooking.Modules.Catalog.Application.MovieImports;

public static class MovieImportNormalizer
{
    public static string NormalizeTitle(string value)
    {
        return ToSlug(value)
            .Replace("-", string.Empty, StringComparison.Ordinal);
    }

    public static string ToSlug(string value)
    {
        var normalized = RemoveDiacritics(value)
            .ToLowerInvariant();
        var builder = new StringBuilder();
        var previousWasDash = false;

        foreach (var character in normalized)
        {
            if (char.IsLetterOrDigit(character))
            {
                builder.Append(character);
                previousWasDash = false;
                continue;
            }

            if (!previousWasDash)
            {
                builder.Append('-');
                previousWasDash = true;
            }
        }

        return builder
            .ToString()
            .Trim('-');
    }

    public static string Hash(params string?[] values)
    {
        var raw = string.Join(
            "|",
            values.Select(value => value?.Trim() ?? string.Empty));

        return Convert.ToHexString(
                SHA256.HashData(Encoding.UTF8.GetBytes(raw)))
            .ToLowerInvariant();
    }

    private static string RemoveDiacritics(string value)
    {
        var normalized = value.Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder();

        foreach (var character in normalized)
        {
            var unicodeCategory =
                CharUnicodeInfo.GetUnicodeCategory(character);

            if (unicodeCategory != UnicodeCategory.NonSpacingMark)
            {
                builder.Append(character);
            }
        }

        return builder
            .ToString()
            .Normalize(NormalizationForm.FormC);
    }
}
