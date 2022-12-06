import React, { useEffect } from "react";
import { fabric } from "fabric";
import { getDocument } from "pdfjs-dist";

function readBlob(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result as string));
    reader.addEventListener("error", reject);
    reader.readAsArrayBuffer(blob);
  });
}

const Home = () => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const fabricRef = React.useRef<fabric.Canvas>();
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  const printPDF = async (pdfData: Blob, pages?: number[]) => {
    const base64data = await readBlob(pdfData);
    const decodedPdf = Buffer.from(base64data, "base64");

    const pdf = await getDocument({ data: decodedPdf }).promise;
    const numPages = pdf.numPages;

    return new Array(numPages).fill(0).map((__, i) => {
      const pageNumber = i + 1;
      if (pages && pages.indexOf(pageNumber) == -1) {
        return;
      }
      return pdf.getPage(pageNumber).then((page) => {
        //  retina scaling
        const viewport = page.getViewport({ scale: window.devicePixelRatio });
        // Prepare canvas using PDF page dimensions
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d") as Object;
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Render PDF page into canvas context
        const renderTask = page.render({ canvasContext: context, viewport });
        return renderTask.promise.then(() => canvas);
      });
    });
  };

  const pdfToImage = async (pdfData: Blob) => {
    const scale = 1 / window.devicePixelRatio;
    const canvasList = await printPDF(pdfData);

    return canvasList.map(async (e) => {
      const pdfCanvas = await e;
      if (!pdfCanvas || !containerRef.current) {
        return;
      }

      containerRef.current.innerHTML = "";

      // Create page canvas
      const canvas = document.createElement("canvas");
      containerRef.current.appendChild(canvas);
      const fabricCanvas = new fabric.Canvas(canvas);

      fabricCanvas.add(
        new fabric.Image(pdfCanvas, {
          scaleX: scale,
          scaleY: scale,
        })
      );

      //   canvas.add(
      //     new fabric.Image(pdfCanvas, {
      //       scaleX: scale,
      //       scaleY: scale,
      //     })
      //   );
    });
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.currentTarget.files || !e.currentTarget.files.length) {
      return;
    }

    const file = e.currentTarget.files[0];
    pdfToImage(file);
  };

  //   useEffect(() => {
  //     fabricRef.current = new fabric.Canvas(canvasRef.current, {
  //       fill: "#ddd",
  //     });
  //     const canvas = fabricRef.current;

  //     //   function resizeCanvas() {
  //     //     canvas.setHeight(window.innerHeight);
  //     //     canvas.setWidth(window.innerWidth);
  //     //     canvas.renderAll();
  //     //   }

  //     //   window.addEventListener("resize", resizeCanvas);
  //     //   resizeCanvas();

  //     return () => {
  //       canvas.dispose();
  //       //   window.removeEventListener("resize", resizeCanvas);
  //     };
  //   }, []);

  return (
    <div className="min-h-[100vh] flex flex-col">
      <div className="p-5">
        <input type="file" onChange={onFileChange} />
      </div>

      <div ref={containerRef} className="flex-1 bg-gray-600 p-5 text-center">
        {/* <canvas ref={canvasRef} /> */}
      </div>
    </div>
  );
};

export default Home;
