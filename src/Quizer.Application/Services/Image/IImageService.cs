﻿using ErrorOr;
using Quizer.Application.Services.Image.Response;

namespace Quizer.Application.Services.Image;

public interface IImageService
{
    Task<ErrorOr<DirectUploadResponse>> DirectUpload(bool requireSignedURLs = false);
    Task<bool> IsSuccessfulyUploaded(Guid imageId);
    Task<bool> DeleteImage(Guid imageId);
    Uri GenerateImageUrl(Guid imageId, string variantName);
}