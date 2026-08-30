"use client";
import { useRef, useState } from "react";

export default function Home() {
  const [imageSrc, setImageSrc] = useState(null);
  const canvasRef = useRef(null);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => drawCanvas(img);
      img.src = e.target.result;
      setImageSrc(event.target.result);
    };
    reader.readAsDataURL(file);
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
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        let index = (y * width + x) * 4; // this is so i dont have to turn the 1d array from data to a 2d array

        let r = data[index];
        let g = data[index + 1];
        let b = data[index + 2];

        let old = (r + g + b) / 3;
        let newColor = old < 128 ? 0 : 255;
        data[index] = newColor;
        data[index + 1] = newColor;
        data[index + 2] = newColor;

        let error = old - newColor;

        const calculateError = (nx, ny, factor) => {
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            let nIdx = (ny * width + nx) * 4;

            data[nIdx] += error * factor;
            data[nIdx + 1] += error * factor;
            data[nIdx + 2] += error * factor;
          }
        };
        calculateError(x + 1, y, 7 / 16); //wait wait wait, why must it be 7/16 you might ask? some dudes before me called floyd-steinberg said it's for the best output thats why
        calculateError(x - 1, y + 1, 3 / 16);
        calculateError(x, y + 1, 5 / 16);
        calculateError(x + 1, y + 1, 1 / 16);
      }
    }
    ctx.putImageData(imageData, 0, 0);
  };
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 flex flex-col items-center">
      <h1 className="text-4xl font-bold mb-2">Stipplr</h1>
      <p className="text-gray-400 mb-8">Dithering & Image processing</p>
      <div>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:bg-violet-50 file:text-sm file:text-black cursor-pointer"
        ></input>
        <div>
          <canvas ref={canvasRef} className="max-w-full h-auto" />
        </div>
      </div>
    </div>
  );
}
