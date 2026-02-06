package com.project.billing_service.client;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.grpc.ManagedChannel;
import org.springframework.stereotype.Component;
import subscription.Subscription;
import subscription.SubscriptionServiceGrpc;

import javax.naming.ServiceUnavailableException;

@Component
public class SubscriptionGrpcClient {

    private final SubscriptionServiceGrpc.SubscriptionServiceBlockingStub stub;

    public SubscriptionGrpcClient(ManagedChannel subscriptionChannel) {
        this.stub = SubscriptionServiceGrpc.newBlockingStub(subscriptionChannel);
    }

    @CircuitBreaker(name = "subscriptionGrpc", fallbackMethod = "subscriptionFallback")
    public Subscription.SubscriptionResponse getSubscription(String subscriptionId) {
        Subscription.GetSubscriptionRequest request =
                Subscription.GetSubscriptionRequest.newBuilder()
                        .setSubscriptionId(subscriptionId)
                        .build();

        return stub.getSubscription(request);
    }

    private Subscription.SubscriptionResponse subscriptionFallback(String id, Throwable ex) throws ServiceUnavailableException {
        throw new ServiceUnavailableException(
                "Subscription service unavailable for " + id
        );
    }
}

