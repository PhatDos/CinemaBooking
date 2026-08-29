using CinemaBooking.Modules.Catalog.Application.Interfaces;
using CinemaBooking.Modules.Catalog.Domain;

namespace CinemaBooking.Modules.Catalog.Application.Movies;

public class MovieService
{
    private readonly IMovieRepository _movieRepository;

    public MovieService(IMovieRepository movieRepository)
    {
        _movieRepository = movieRepository;
    }

    public async Task<List<MovieResponse>> GetAllAsync()
    {
        var movies = await _movieRepository.GetAllAsync();

        return movies
            .Select(ToResponse)
            .ToList();
    }

    public async Task<MovieResponse?> GetByIdAsync(Guid id)
    {
        var movie = await _movieRepository.GetByIdAsync(id);

        if (movie is null)
        {
            return null;
        }

        return ToResponse(movie);
    }

    public async Task<MovieResponse> CreateAsync(CreateMovieRequest request)
    {
        var movie = new Movie
        {
            Id = Guid.NewGuid(),
            Title = request.Title.Trim(),
            Description = request.Description?.Trim(),
            DurationMinutes = request.DurationMinutes,
            ReleaseDate = request.ReleaseDate
        };

        await _movieRepository.AddAsync(movie);

        return ToResponse(movie);
    }

    private static MovieResponse ToResponse(Movie movie)
    {
        return new MovieResponse
        {
            Id = movie.Id,
            Title = movie.Title,
            Description = movie.Description,
            DurationMinutes = movie.DurationMinutes,
            ReleaseDate = movie.ReleaseDate
        };
    }
}
