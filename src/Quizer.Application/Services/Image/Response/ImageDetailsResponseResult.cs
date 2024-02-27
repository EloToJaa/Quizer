﻿using System.Text.Json.Serialization;

namespace Quizer.Application.Services.Image.Response;

public class ImageDetailsResponseResult
{
    [JsonPropertyName("filename")]
    public string? Filename { get; set; }

    [JsonPropertyName("id")]
    public required Guid Id { get; set; }

    [JsonPropertyName("meta")]
    public Dictionary<string, string> Meta { get; set; } = new();

    [JsonPropertyName("requireSignedURLs")]
    public required bool RequireSignedUrls { get; set; }

    [JsonPropertyName("uploaded")]
    public required DateTime Uploaded { get; set; }

    [JsonPropertyName("variants")]
    public List<Uri> Variants { get; set; } = new();

    [JsonPropertyName("draft")]
    public bool Draft { get; set; } = false;
}
