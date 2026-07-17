using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AltitudELog.Application.Common.Interfaces;
using AltitudELog.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace AltitudELog.Infrastructure.Identity;

public class JwtTokenGenerator : IJwtTokenGenerator
{
    private readonly IConfiguration _configuration;

    public JwtTokenGenerator(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public (string Token, DateTime ExpiresAtUtc) GenerateToken(Pilot pilot)
    {
        var key = _configuration["Jwt:Key"]!;
        var issuer = _configuration["Jwt:Issuer"];
        var audience = _configuration["Jwt:Audience"];
        var expiryMinutes = _configuration.GetValue<int>("Jwt:ExpiryMinutes");

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, pilot.Id.ToString()),
            new Claim(ClaimTypes.Name, pilot.Username),
            new Claim(ClaimTypes.Role, pilot.Rank.ToString())
        };

        var signingCredentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
            SecurityAlgorithms.HmacSha256);

        var expiresAtUtc = DateTime.UtcNow.AddMinutes(expiryMinutes);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: expiresAtUtc,
            signingCredentials: signingCredentials);

        return (new JwtSecurityTokenHandler().WriteToken(token), expiresAtUtc);
    }
}
