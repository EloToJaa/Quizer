using Quizer.Api;
using Quizer.Application;
using Quizer.Infrastructure;
using Serilog;

var builder = WebApplication.CreateBuilder(args);
{
    builder.Host.UseSerilog((context, configuration) =>
        configuration.ReadFrom.Configuration(context.Configuration));
    builder.Services
        .AddApplication()
        .AddInfractructure(builder.Configuration)
        .AddPresentation(builder.Configuration);
}

Log.Logger =
    new LoggerConfiguration()
        .ReadFrom.Configuration(builder.Configuration)
    .CreateLogger();

var app = builder.Build();
{
    app.UsePresentation(builder.Configuration);
}

