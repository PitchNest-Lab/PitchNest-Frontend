import React from 'react';
import { Link } from 'react-router-dom';
import LegalLayout from '../../components/LegalLayout';
import { CONTACT_EMAIL, TERMS_LAST_UPDATED } from '../../lib/legal';

export default function RefundPolicy() {
  return (
    <LegalLayout title="Refunds & Cancellations" lastUpdated={TERMS_LAST_UPDATED}>
      <p>
        This policy explains how cancelling and refunds work for PitchNest plans. It forms part of our{' '}
        <Link to="/terms">Terms of Service</Link>.
      </p>

      <h2>1. Free trial</h2>
      <p>
        New accounts start with a free trial of full Pro access. No card is needed and nothing is charged, so there is
        nothing to refund. When the trial ends, your account moves to the Free plan unless you subscribe.
      </p>

      <h2>2. How plans renew</h2>
      <ul>
        <li>
          <strong>Automatic renewal:</strong> your card is charged at the start of each period, monthly or yearly, until
          you cancel.
        </li>
        <li>
          <strong>Manual renewal:</strong> you pay once for a period. Nothing is charged again unless you start another
          payment.
        </li>
      </ul>
      <p>
        The price, currency and renewal option are shown before you pay. A plan keeps the amount you subscribed at for
        as long as it renews.
      </p>

      <h2>3. Cancelling</h2>
      <p>
        You can cancel automatic renewal at any time in Settings, under Billing. Future charges stop, and you keep your
        plan until the end of the period you have paid for. A manual plan has nothing to cancel: it ends when its paid
        period ends.
      </p>

      <h2>4. Refunds</h2>
      <ul>
        <li>
          <strong>Your first payment:</strong> if PitchNest isn&apos;t right for you, ask within 7 days of your first
          payment for a plan and we will refund it in full.
        </li>
        <li>
          <strong>After that:</strong> later payments, including renewals, are not refundable, and we don&apos;t refund
          unused time in a period, including after you cancel. If you don&apos;t want another period, cancel before your
          renewal date.
        </li>
        <li>
          <strong>Mistaken or duplicate charges:</strong> if you were charged twice for the same period, or charged after
          cancelling, we refund the extra charge in full.
        </li>
      </ul>

      <h2>5. How refunds are paid</h2>
      <p>
        Refunds go back to the original payment method through our payment provider, Flutterwave, in the currency you
        paid. They usually arrive within 5 to 10 business days, depending on your bank. When a payment is refunded, the
        paid access it bought ends.
      </p>

      <h2>6. How to ask</h2>
      <p>
        Email <a href={`mailto:${CONTACT_EMAIL}?subject=Refund%20request`}>{CONTACT_EMAIL}</a> from the address on your
        account, with the date and amount of the payment, and the payment reference if you have it. Deleting your account
        does not request a refund by itself, so ask for any refund you are owed first.
      </p>

      <h2>7. Your rights</h2>
      <p>This policy does not limit any rights you have under the consumer law where you live.</p>
    </LegalLayout>
  );
}
