package com.project.billing_service.controller;

import com.project.billing_service.model.dtos.InvoiceDto;
import com.project.billing_service.model.entities.InvoiceEntity;
import com.project.billing_service.service.BillingService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/billing")
@RequiredArgsConstructor
public class BillingController {

    private final BillingService billingService;

    @PostMapping("/invoices")
    public InvoiceEntity createInvoice(@RequestBody InvoiceDto dto) {
        return billingService.createInvoice(dto);
    }

    @GetMapping("/invoices/{id}")
    public InvoiceEntity getInvoice(@PathVariable UUID id) {
        return billingService.getInvoice(id);
    }

    @PostMapping("/invoices/{id}/pay")
    public String payInvoice(
            @PathVariable UUID id,
            @RequestParam String paymentMethodId
    ) {
        return billingService.payInvoice(id, paymentMethodId);
    }
}
