package com.project.billing_service.repository;

public interface InvoiceRepository
        extends JpaRepository<InvoiceEntity, UUID> {

    List<InvoiceEntity> findByBillingAccountId(UUID billingAccountId);

    List<InvoiceEntity> findByStatus(String status);
}
