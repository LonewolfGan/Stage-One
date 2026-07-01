/**
 * StripePaymentForm — must be rendered inside a Stripe <Elements> context.
 *
 * Extracted from booking.tsx so the Stripe-specific hooks (useStripe,
 * useElements) are co-located with the payment UI, not scattered across
 * the booking flow page.
 */

import type { FormEvent } from "react";
import { useState } from "react";
import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/DSButton";

interface Props {
  bookingId: string;
  onError: (message: string) => void;
}

export function StripePaymentForm({ bookingId, onError }: Props) {
  const stripe   = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/booking/confirmation?id=${bookingId}`,
      },
    });
    if (error) {
      onError(error.message ?? "Erreur lors du paiement");
      setProcessing(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <PaymentElement />
      <Button
        type="submit"
        variant="primary"
        size="lg"
        disabled={processing || !stripe}
        style={{ width: "100%" }}
      >
        {processing ? "Paiement en cours…" : "Payer maintenant"}
      </Button>
    </form>
  );
}
