package com.project.billing_service.service;

import com.project.billing_service.events.UsageChargeEventProducer;
import com.project.billing_service.model.entities.UsageChargeEntity;
import com.project.billing_service.repository.UsageChargeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationAdapter;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.math.BigDecimal;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UsageChargeService {
    private final UsageChargeRepository repository;
    private final UsageChargeEventProducer eventProducer;

    @Transactional
    public UsageChargeEntity createUsageCharge(
            UUID invoiceId,
            String metric,
            long quantity,
            BigDecimal unitPrice
    ) {
        BigDecimal totalPrice = unitPrice.multiply(BigDecimal.valueOf(quantity));

        UsageChargeEntity entity = new UsageChargeEntity();
        entity.setInvoiceId(invoiceId);
        entity.setMetric(metric);
        entity.setQuantity(quantity);
        entity.setUnitPrice(unitPrice);
        entity.setTotalPrice(totalPrice);

        UsageChargeEntity saved = repository.save(entity);

        // ensuring event is published after DB commit
        TransactionSynchronizationManager.registerSynchronization(
                new TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        eventProducer.publish(saved);
                    }
                }
        );

        return saved;
    }
}
