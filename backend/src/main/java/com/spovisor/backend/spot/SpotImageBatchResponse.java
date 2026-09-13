package com.spovisor.backend.spot;

import java.util.List;

public record SpotImageBatchResponse(
        long spotId,
        String source,
        List<SpotImageResponse> images
) {
}
