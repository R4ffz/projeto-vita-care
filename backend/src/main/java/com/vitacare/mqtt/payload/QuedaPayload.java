package com.vitacare.mqtt.payload;

import java.time.Instant;

public record QuedaPayload(
        Boolean detectada,
        Double intensidade,
        Instant ts
) {
}
