using AltitudELog.Application.Common.Behaviors;
using AltitudELog.Application.Chat;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;

namespace AltitudELog.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddSingleton<IChatKnowledgeBaseService, ChatKnowledgeBaseService>();
        services.AddScoped<IPersonalChatService, PersonalChatService>();
        services.AddScoped<IChatInteractionService, ChatInteractionService>();
        services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly);

        services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssembly(typeof(DependencyInjection).Assembly);
            cfg.AddOpenBehavior(typeof(ValidationBehavior<,>));
            cfg.AddOpenBehavior(typeof(CachingBehavior<,>));
            cfg.AddOpenBehavior(typeof(CacheInvalidationBehavior<,>));
        });

        return services;
    }
}
