package com.vitacare.mqtt.payload;

import java.time.Instant;

public record StatusPayload(
        Boolean online,
        Instant ts
) {
}
