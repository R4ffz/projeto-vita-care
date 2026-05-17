package com.vitacare.mqtt.payload;

import java.time.Instant;

public record SinalPayload(
        Integer bpm,
        Integer spo2,
        Double temp,
        Instant ts
) {
}
