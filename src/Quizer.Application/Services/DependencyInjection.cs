﻿using Diacritics;
using Microsoft.Extensions.DependencyInjection;
using Quizer.Application.Services.Slugify;

namespace Quizer.Application.Services;

public static class DependencyInjection
{
    public static IServiceCollection AddServices(this IServiceCollection services)
    {
        services.AddSingleton<IDiacriticsMapper, DefaultDiacriticsMapper>();
        services.AddSingleton<ISlugifyService, SlugifyService>();

        return services;
    }
}

