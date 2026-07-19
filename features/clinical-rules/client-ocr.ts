import {
  CHECKUP_FIELD_IDS,
  extractCheckupValuesFromText,
  mergeCheckupExtractions,
  type CheckupPdfExtraction,
} from "./pdf-extraction.ts";

export type OcrProgress = { percent: number; message: string };
type OcrSource = File | Blob | HTMLCanvasElement;
type PdfViewport = { width: number; height: number };
type PdfPage = {
  cleanup: () => void;
  getViewport: (options: { scale: number }) => PdfViewport;
  render: (options: { canvas: HTMLCanvasElement; canvasContext: CanvasRenderingContext2D; viewport: PdfViewport }) => { promise: Promise<void> };
};
export type OcrPdfDocument = { getPage: (pageNumber: number) => Promise<unknown>; numPages: number };
export type TargetedOcrResult = CheckupPdfExtraction & { pagesProcessed: number; totalPages: number };

const emptyExtraction = (): CheckupPdfExtraction => ({
  values: {}, foundFields: [], missingFields: [...CHECKUP_FIELD_IDS],
});

const createHealthOcrWorker = async (
  totalSources: number,
  getCurrentIndex: () => number,
  getFoundCount: () => number,
  onProgress: (progress: OcrProgress) => void,
) => {
  const { createWorker, OEM, PSM } = await import("tesseract.js");
  const worker = await createWorker(["kor", "eng"], OEM.LSTM_ONLY, {
    langPath: "https://tessdata.projectnaptha.com/4.0.0_fast",
    logger: (event) => {
      const currentIndex = getCurrentIndex();
      const pageProgress = event.status === "recognizing text" ? event.progress : 0;
      onProgress({
        percent: Math.min(99, Math.round(((currentIndex + pageProgress) / totalSources) * 100)),
        message: event.status === "recognizing text"
          ? `${currentIndex + 1}/${totalSources}쪽을 인식 중입니다. 필요한 수치 ${getFoundCount()}개 발견`
          : "한국어·영어 OCR 모델을 준비하고 있습니다.",
      });
    },
  });
  await worker.setParameters({
    tessedit_pageseg_mode: PSM.SPARSE_TEXT,
    preserve_interword_spaces: "1",
    user_defined_dpi: "300",
  });
  return worker;
};

const renderPdfPage = async (pdf: OcrPdfDocument, pageNumber: number) => {
  const page = (await pdf.getPage(pageNumber)) as PdfPage;
  try {
    const baseViewport = page.getViewport({ scale: 1 });
    const scale = Math.min(2.5, Math.max(1.5, 1900 / baseViewport.width));
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("Canvas context is unavailable");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvas, canvasContext: context, viewport }).promise;
    return canvas;
  } finally {
    page.cleanup();
  }
};

async function recognizeSources(
  sourceCount: number,
  getSource: (index: number) => Promise<OcrSource>,
  onProgress: (progress: OcrProgress) => void,
): Promise<TargetedOcrResult> {
  let currentIndex = 0;
  let extraction = emptyExtraction();
  const worker = await createHealthOcrWorker(
    sourceCount, () => currentIndex, () => extraction.foundFields.length, onProgress,
  );
  try {
    for (currentIndex = 0; currentIndex < sourceCount; currentIndex += 1) {
      const source = await getSource(currentIndex);
      const result = await worker.recognize(source);
      extraction = mergeCheckupExtractions(extraction, extractCheckupValuesFromText(result.data.text));
      onProgress({
        percent: Math.round(((currentIndex + 1) / sourceCount) * 100),
        message: `${currentIndex + 1}/${sourceCount}쪽 완료 · 필요한 수치 ${extraction.foundFields.length}개 발견`,
      });
      if (source instanceof HTMLCanvasElement) {
        source.width = 0;
        source.height = 0;
      }
    }
  } finally {
    await worker.terminate();
  }
  return { ...extraction, pagesProcessed: sourceCount, totalPages: sourceCount };
}

export async function recognizeHealthDocumentImage(file: File, onProgress: (progress: OcrProgress) => void) {
  return recognizeSources(1, async () => file, onProgress);
}

export async function recognizeHealthDocumentPdf(pdf: OcrPdfDocument, onProgress: (progress: OcrProgress) => void) {
  // 한 번에 한 페이지만 캔버스로 만들어 메모리를 해제하므로 페이지 수 제한 없이 처리합니다.
  return recognizeSources(pdf.numPages, (index) => renderPdfPage(pdf, index + 1), onProgress);
}
