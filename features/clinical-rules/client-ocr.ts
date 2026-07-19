export const OCR_PDF_PAGE_LIMIT = 8;

export type OcrProgress = {
  percent: number;
  message: string;
};

type OcrSource = File | Blob | HTMLCanvasElement;

type PdfViewport = {
  width: number;
  height: number;
};

type PdfPage = {
  cleanup: () => void;
  getViewport: (options: { scale: number }) => PdfViewport;
  render: (options: {
    canvas: HTMLCanvasElement;
    canvasContext: CanvasRenderingContext2D;
    viewport: PdfViewport;
  }) => { promise: Promise<void> };
};

export type OcrPdfDocument = {
  getPage: (pageNumber: number) => Promise<unknown>;
  numPages: number;
};

const createHealthOcrWorker = async (
  totalSources: number,
  getCurrentIndex: () => number,
  onProgress: (progress: OcrProgress) => void,
) => {
  const { createWorker, OEM, PSM } = await import("tesseract.js");
  const worker = await createWorker(["kor", "eng"], OEM.LSTM_ONLY, {
    langPath: "https://tessdata.projectnaptha.com/4.0.0_fast",
    logger: (event) => {
      const currentIndex = getCurrentIndex();
      const pageProgress =
        event.status === "recognizing text" ? event.progress : 0;
      onProgress({
        percent: Math.min(
          99,
          Math.round(((currentIndex + pageProgress) / totalSources) * 100),
        ),
        message:
          event.status === "recognizing text"
            ? `OCR로 ${currentIndex + 1}번째 이미지를 읽고 있습니다.`
            : "한국어·영문 OCR 모델을 준비하고 있습니다.",
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

const renderPdfPage = async (
  pdf: OcrPdfDocument,
  pageNumber: number,
): Promise<HTMLCanvasElement> => {
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
    await page.render({
      canvas,
      canvasContext: context,
      viewport,
    }).promise;
    return canvas;
  } finally {
    page.cleanup();
  }
};

async function recognizeSources(
  sourceCount: number,
  getSource: (index: number) => Promise<OcrSource>,
  onProgress: (progress: OcrProgress) => void,
) {
  let currentIndex = 0;
  const worker = await createHealthOcrWorker(
    sourceCount,
    () => currentIndex,
    onProgress,
  );
  const texts: string[] = [];
  try {
    for (currentIndex = 0; currentIndex < sourceCount; currentIndex += 1) {
      const source = await getSource(currentIndex);
      const result = await worker.recognize(source);
      texts.push(result.data.text);
      onProgress({
        percent: Math.round(((currentIndex + 1) / sourceCount) * 100),
        message: `${currentIndex + 1}개 이미지의 OCR 인식을 완료했습니다.`,
      });
      if (source instanceof HTMLCanvasElement) {
        source.width = 0;
        source.height = 0;
      }
    }
  } finally {
    await worker.terminate();
  }
  return texts.join("\n");
}

export async function recognizeHealthDocumentImage(
  file: File,
  onProgress: (progress: OcrProgress) => void,
) {
  return recognizeSources(1, async () => file, onProgress);
}

export async function recognizeHealthDocumentPdf(
  pdf: OcrPdfDocument,
  onProgress: (progress: OcrProgress) => void,
) {
  const pagesProcessed = Math.min(pdf.numPages, OCR_PDF_PAGE_LIMIT);
  const text = await recognizeSources(
    pagesProcessed,
    (index) => renderPdfPage(pdf, index + 1),
    onProgress,
  );
  return {
    text,
    pagesProcessed,
    truncated: pdf.numPages > pagesProcessed,
  };
}
