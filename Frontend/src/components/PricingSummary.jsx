import React from "react";
import {
  TRANSLATION_FEE_PER_PAGE,
  NOTARY_FEE,
  SHIPPING_FEE,
} from "./constants/pricing";

const PricingSummary = ({ submissions, onProceedToPayment }) => {
  const pending = submissions.filter((s) => !s.locked);

  const totalPages = pending.reduce(
    (sum, s) =>
      sum +
      (s.files
        ? s.files.reduce((fSum, f) => fSum + (f.pageCount || 1), 0)
        : 0),
    0
  );

  const hasNotary = pending.some((s) => s.needNotary);
  const needsShipping = pending.some(
    (s) =>
      s.deliveryMethod === "hard copy" || s.deliveryMethod === "both"
  );

  const translationCost = totalPages * TRANSLATION_FEE_PER_PAGE;
  const notaryCost = hasNotary ? NOTARY_FEE : 0;
  const shippingCost = needsShipping ? SHIPPING_FEE : 0;

  const totalCost = translationCost + notaryCost + shippingCost;

  if (pending.length === 0) return null;

  return (
    <div className="border-t mt-6 pt-4">
      <h3 className="text-lg font-semibold">Pricing Summary</h3>
      <p>Total Pages: {totalPages}</p>
      <p>Translation Fee: ${TRANSLATION_FEE_PER_PAGE} / page</p>
      <p>Translation Total: ${translationCost}</p>
      {hasNotary && <p>Notary Fee: ${NOTARY_FEE}</p>}
      {needsShipping && <p>Shipping Fee: ${SHIPPING_FEE}</p>}
      <p className="font-bold mt-2">Total: ${totalCost}</p>

      <button
        onClick={onProceedToPayment}
        className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Proceed to Payment (${totalCost})
      </button>

      <p className="text-xs text-gray-500 mt-1">
        Once you proceed to payment, submissions are locked and cannot be deleted.
      </p>
    </div>
  );
};

export default PricingSummary;
