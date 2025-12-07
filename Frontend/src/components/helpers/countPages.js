import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.entry";

// For v5.x: set workerSrc to CDN URL

GlobalWorkerOptions.workerSrc = pdfjsWorker;

export const countPages = async (file) => {
  if (file.type === "application/pdf") {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await getDocument({ data: arrayBuffer }).promise;
    return pdf.numPages;
  }
  if (file.type.startsWith("image/")) {
    return 1;
  }
  return 0;
};

