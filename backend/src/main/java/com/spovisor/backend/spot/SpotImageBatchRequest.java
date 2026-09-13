package com.spovisor.backend.spot;

import java.util.List;

public record SpotImageBatchRequest(
        String cacheSessionId,
        List<SpotImageQuery> spots
) {
}
