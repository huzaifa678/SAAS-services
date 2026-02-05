package com.project.billing_service.repository;

public interface BillingRepository
        extends JpaRepository<BillingAccountEntity, UUID> {

    Optional<BillingAccountEntity> findByUserId(UUID userId);
}
