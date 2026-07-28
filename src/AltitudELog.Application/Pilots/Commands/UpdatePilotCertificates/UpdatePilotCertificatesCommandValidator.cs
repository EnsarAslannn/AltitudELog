using FluentValidation;

namespace AltitudELog.Application.Pilots.Commands.UpdatePilotCertificates;

public class UpdatePilotCertificatesCommandValidator : AbstractValidator<UpdatePilotCertificatesCommand>
{
    public UpdatePilotCertificatesCommandValidator()
    {
        RuleFor(c => c.LicenseExpiryDate)
            .Must(BeWithinReasonableRange)
            .WithMessage("License expiry date is unreasonably far in the future.")
            .When(c => c.LicenseExpiryDate.HasValue);

        RuleFor(c => c.MedicalExpiryDate)
            .Must(BeWithinReasonableRange)
            .WithMessage("Medical expiry date is unreasonably far in the future.")
            .When(c => c.MedicalExpiryDate.HasValue);
    }

    private static bool BeWithinReasonableRange(DateOnly? date) =>
        date is null || date.Value <= DateOnly.FromDateTime(DateTime.UtcNow).AddYears(50);
}
