"use client";
import { useEffect, useRef, useState } from "react";

export default function Home() {
  const [imageSrc, setImageSrc] = useState(null);
  const [focused, setFocused] = useState(0); // 0 is view, 1 is controls, 2 is pallete
  const canvasRef = useRef(null);
  const loadedImgRef = useRef(null);

  const pallete = [
    [15, 56, 15],
    [48, 98, 48],
    [139, 172, 15],
    [155, 188, 15],
  ];

  useEffect(() => {
    const handleKeydown = (e) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
      }
      setFocused((prev) => {
        if (e.key === "ArrowUp") {
          return prev > 0 ? prev - 1 : prev;
        } else if (e.key === "ArrowDown") {
          return prev < 2 ? prev + 1 : prev;
        } else if (e.key === "ArrowLeft") {
          return prev != 0 ? 0 : prev;
        } else if (e.key === "ArrowRight") {
          return prev === 0 ? 1 : prev;
        }
        return prev;
      });
    };
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, []);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        loadedImgRef.current = img;
        drawCanvas(img);
        setImageSrc(e.target.result);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };
  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = "stipplr-export.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const findClosestColor = (r, g, b, pallete) => {
    //finds closest color using super special 3d distance formula that i always forget
    let minDistance = Infinity;
    let closestColor = pallete[0];

    for (let i = 0; i < pallete.length; i++) {
      const [pr, pg, pb] = pallete[i];
      const distance = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2;

      if (distance < minDistance) {
        minDistance = distance;
        closestColor = pallete[i];
      }
    }
    return closestColor;
  };

  const drawCanvas = (img) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let width = img.width;
    let height = img.height;
    canvas.width = width;
    canvas.height = height;

    ctx.drawImage(img, 0, 0);
    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    // ok some confusing math is coming so bear with me

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let index = (y * width + x) * 4; // this is so i dont have to turn the 1d array from data to a 2d array

        let oldR = data[index];
        let oldG = data[index + 1];
        let oldB = data[index + 2];

        const [newR, newG, newB] = findClosestColor(oldR, oldG, oldB, pallete);

        data[index] = newR;
        data[index + 1] = newG;
        data[index + 2] = newB;

        let errR = oldR - newR;
        let errG = oldG - newG;
        let errB = oldB - newB;

        const calculateError = (nx, ny, errR, errG, errB, factor) => {
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            let nIdx = (ny * width + nx) * 4;
            data[nIdx] += errR * factor;
            data[nIdx + 1] += errG * factor;
            data[nIdx + 2] += errB * factor;
          }
        };

        calculateError(x + 1, y, errR, errG, errB, 7 / 16); //wait wait wait, why must it be 7/16 you might ask? some dudes before me called floyd-steinberg said it's for the best output thats why
        calculateError(x - 1, y + 1, errR, errG, errB, 3 / 16);
        calculateError(x, y + 1, errR, errG, errB, 5 / 16);
        calculateError(x + 1, y + 1, errR, errG, errB, 1 / 16);
      }
    }
    ctx.putImageData(imageData, 0, 0);
  };
  //   return (
  //     <div className="min-h-screen bg-gray-900 text-white p-8 flex flex-col items-center">
  //       <h1 className="text-4xl font-bold mb-2">Stipplr</h1>
  //       <p className="text-gray-400 mb-8">Dithering & Image processing</p>
  //       <div>
  //         <input
  //           type="file"
  //           accept="image/*"
  //           onChange={handleImageUpload}
  //           className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:bg-violet-50 file:text-sm file:text-black cursor-pointer"
  //         ></input>
  //         <div>
  //           <canvas ref={canvasRef} className="max-w-full h-auto" />
  //         </div>
  //         <button onClick={handleExport}>Export</button>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="h-screen w-screen bg-[#0d0d0d] text-[#d0d0d0] font-mono p-3 flex flex-col gap-2 select-none overflow-hidden">
      <div className="bg-[#181818] border border-[#2a2a2a] px-4 py-1 flex justify-between text-xs text-[#888]">
        <div className="flex gap-4">
          <p className="text-[#a3ff00] font-bold">stipplr</p>
          <p className={focused === 0 ? "text-white underline" : ""}>
            [1: View]
          </p>
          <p className={focused === 1 ? "text-white underline" : ""}>
            [2: Controls]
          </p>
          <p className={focused === 2 ? "text-white underline" : ""}>
            [3: Pallete]
          </p>
        </div>
        <div>NAV: arrowkeys</div>
      </div>
      {/*grid*/}
      <div className="flex-1 grid grid-cols-12 gap-3 min-h-0">
        {/*view window*/}
        <div
          onClick={() => setFocused(0)}
          className={`col-span-8 flex flex-col min-h-0 border transition-all duration-75 bg-[#111111] ${focused === 0 ? "border-[#a3ff00] shadow-[0_0_12px_rgba(163,255,0,0.15)]" : "border-[#262626] opacity-80"}`}
        >
          <div
            className={`px-2 py-1 text-xs flex justify-between font-bold ${focused === 0 ? "bg-[#a3ff00] text-black" : "bg-[#202020] text-gray-500"}`}
          >
            <p>[0 VIEW.RAW]</p>
            <p>FLOYD-STEINBERG</p>
          </div>
          <div className="flex-1 p-4 flex items-center justify-center bg-black overflow-auto relative">
            {!imageSrc && (
              <div className="absolute text-center text-xs text-gray-400 border border-dashed border-gray-700 p-8">
                / NO IMAGE ADDED, SELECT IN PANEL[1]
              </div>
            )}
            <canvas
              ref={canvasRef}
              className={`max-w-full max-h-full w-auto object-contain h-auto [image-rendering:pixelated] ${!imageSrc ? "hidden" : "block"}`}
            />
          </div>
        </div>
        {/* right stack */}
        <div className="col-span-4 flex flex-col gap-3">
          <div
            onClick={() => setFocused(1)}
            className={`flex-1 flex flex-col border transition-all duration-75 bg-[#111111] ${focused === 1 ? "border-[#a3ff00] shadow-[0_0_12px_rgba(163,255,0,0.15)]" : "border-[#262626] opacity-80"}`}
          >
            <div
              className={`px-2 py-1 text-xs flex justify-between font-bold ${focused === 1 ? "bg-[#a3ff00] text-black" : "bg-[#202020] text-[#777]"}`}
            >
              <p>[1] Controls</p>
              <p>FILE</p>
            </div>
            <div className="p-4 flex flex-col gap-4 text-xs">
              <div>
                <label className="block text-gray-400 mb-2">
                  // SELECT IMAGE
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full text-xs text-gray-300 file:mr-3 file:py-1 file:px-3 file:border file:border-gray-600 file:bg-[1a1a1a] file:text-[#a3ff00] file:cursor-pointer hover:file:bg-[#252525]"
                ></input>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
