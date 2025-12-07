// src/components/CostSummary.jsx
import React from "react";
import {
  EVALUATION_FEE,
  TRANSLATION_FEE_PER_PAGE,
  TRANSCRIPT_FEE,
  SHIPPING_FEE,
} from "./constants/pricing"; // make sure these are defined

const CostSummary = ({ submission, onProceedToPayment }) => {
  if (!submission || !submission.documents) {
    return null;
  }

  // Pages for translation cost
  const totalPages = submission.documents.reduce(
    (sum, doc) => sum + (doc.pageCount || 1),
    0
  );
  const translationCost = totalPages * TRANSLATION_FEE_PER_PAGE;

  // Delivery method cost
  let methodLabel = "";
  let methodCost = 0;

  if (submission.submissionMethod === "digital") {
    methodLabel = "Transcript Fee (school release)";
    methodCost = EVALUATION_FEE + TRANSCRIPT_FEE;
  } else if (submission.submissionMethod === "sealed") {
    methodLabel = "Shipping Fee (sealed packet)";
    methodCost = EVALUATION_FEE + SHIPPING_FEE;
  } else {
    methodLabel = "Processing Fee";
    methodCost = 0;
  }

  const totalCost = methodCost + translationCost;

  const isPaid = submission.paymentStatus === "paid" || submission.locked;

  return (
    <div className="bg-gray-50 p-4 mt-2 rounded border">
      <h5 className="font-semibold mb-2">Pricing Summary</h5>

      <p>
        Evaluation fee( ${EVALUATION_FEE}) + {methodLabel}:{" "}
        <strong>${methodCost.toFixed(2)}</strong>
      </p>

      <p>
        Translation Fee (${TRANSLATION_FEE_PER_PAGE}/page):{" "}
        <strong>${translationCost.toFixed(2)}</strong>{" "}
        ({totalPages} pages)
      </p>

      <p className="font-bold mt-2">
        Total: ${totalCost.toFixed(2)}
      </p>

      {isPaid ? (
        <div className="mt-2 text-green-700 text-sm font-semibold">
          ✅ Payment received. This submission is locked.
        </div>
      ) : (
        <>
          <button
            onClick={onProceedToPayment}
            className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Proceed to Payment (${totalCost.toFixed(2)})
          </button>
          <p className="text-xs text-gray-500 mt-1">
            Once you proceed to payment, this submission will be locked and you
            will not be able to delete or modify documents.
          </p>
        </>
      )}
    </div>
  );
};

export default CostSummary;
