package com.project.billing_service.events;

import com.project.billing_service.model.entities.UsageChargeEntity;

public class UsageChargeCreatedEvent {

    private final UsageChargeEntity entity;

    public UsageChargeCreatedEvent(UsageChargeEntity entity) {
        this.entity = entity;
    }

    public UsageChargeEntity getEntity() {
        return entity;
    }
}
