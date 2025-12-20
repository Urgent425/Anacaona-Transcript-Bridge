// src/components/CostSummary.jsx
import React, { useMemo } from "react";
import {
  EVALUATION_FEE,
  TRANSLATION_FEE_PER_PAGE,
  TRANSCRIPT_FEE,
  SHIPPING_FEE,
} from "./constants/pricing";

const CostSummary = ({
  submission,
  onProceedToPayment,          // initial evaluation checkout
  onPayAdditionalTranslation,   // optional: supplemental translation checkout
}) => {
  if (!submission || !Array.isArray(submission.documents)) return null;

  const isEvalPaid = submission.paymentStatus === "paid";

  // Charge translation ONLY for docs marked needsTranslation
  const translationPagesAll = useMemo(() => {
    return submission.documents.reduce((sum, doc) => {
      if (!doc?.needsTranslation) return sum;
      return sum + (Number(doc.pageCount) || 1);
    }, 0);
  }, [submission.documents]);

  // If you later add doc.translationPaid, we will only charge unpaid pages
  // (If translationPaid is missing, treat as unpaid.)
  const translationPagesUnpaid = useMemo(() => {
    return submission.documents.reduce((sum, doc) => {
      if (!doc?.needsTranslation) return sum;
      if (doc.translationPaid === true) return sum;
      return sum + (Number(doc.pageCount) || 1);
    }, 0);
  }, [submission.documents]);

  const translationCostUnpaid = translationPagesUnpaid * TRANSLATION_FEE_PER_PAGE;

  // Evaluation method cost (base fee + method fee)
  const methodFee = useMemo(() => {
  if (submission.submissionMethod === "digital") return TRANSCRIPT_FEE;
  if (submission.submissionMethod === "sealed") return SHIPPING_FEE;
  return 0;
}, [submission.submissionMethod]);

const methodLabel = submission.submissionMethod === "digital"
  ? "Transcript Fee (school release)"
  : submission.submissionMethod === "sealed"
  ? "Shipping Fee (sealed packet)"
  : "Method Fee";

const evaluationTotal = EVALUATION_FEE + methodFee;

  // What should the button charge?
  // - If evaluation NOT paid: pay methodCost + translation pages (all translation pages currently in package)
  // - If evaluation paid: pay ONLY unpaid translation pages (supplement)
  const totalDueNow = isEvalPaid ? translationCostUnpaid : (methodCost + (translationPagesAll * TRANSLATION_FEE_PER_PAGE));

  const canPayInitial = !isEvalPaid;
  const canPaySupplement = isEvalPaid && translationPagesUnpaid > 0 && typeof onPayAdditionalTranslation === "function";

  return (
    <div className="bg-gray-50 p-4 mt-2 rounded border">
      <h5 className="font-semibold mb-2">Pricing Summary</h5>

     <p>Evaluation Fee: <strong>${EVALUATION_FEE.toFixed(2)}</strong></p>
    <p>{methodLabel}: <strong>${methodFee.toFixed(2)}</strong></p>
    <p className="font-semibold">Evaluation subtotal: ${evaluationTotal.toFixed(2)}</p>


      <p>
        Translation Fee (${TRANSLATION_FEE_PER_PAGE}/page):{" "}
        <strong>
          $
          {(
            (isEvalPaid ? translationPagesUnpaid : translationPagesAll) *
            TRANSLATION_FEE_PER_PAGE
          ).toFixed(2)}
        </strong>{" "}
        (
        {isEvalPaid ? `${translationPagesUnpaid} new/unpaid` : `${translationPagesAll}`}{" "}
        page(s))
      </p>

      <p className="font-bold mt-2">Due now: ${totalDueNow.toFixed(2)}</p>

      {/* Status messaging */}
      {isEvalPaid ? (
        <div className="mt-2 text-green-700 text-sm font-semibold">
          ✅ Evaluation payment received. You may still add documents.
        </div>
      ) : (
        <div className="mt-2 text-yellow-700 text-sm font-semibold">
          ⏳ Evaluation not paid yet.
        </div>
      )}

      {/* Actions */}
      <div className="mt-3 flex flex-col sm:flex-row gap-2">
        {canPayInitial && (
          <button
            onClick={onProceedToPayment}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Proceed to Payment (${totalDueNow.toFixed(2)})
          </button>
        )}

        {canPaySupplement && (
          <button
            onClick={onPayAdditionalTranslation}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Pay Additional Translation (${translationCostUnpaid.toFixed(2)})
          </button>
        )}
      </div>

      <p className="text-xs text-gray-500 mt-2 leading-snug">
        After evaluation payment, you can still upload additional documents.
        If new documents need translation, you will pay only for the new pages.
      </p>
    </div>
  );
};

export default CostSummary;
