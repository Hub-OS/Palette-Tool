import { InputImages } from "./input-images";

type PaletteWorkspaceConstructorParams = {
  colorCanvas: HTMLCanvasElement;
  paletteCanvas: HTMLCanvasElement;
  grayCanvas: HTMLCanvasElement;
};

export default class PaletteWorkspace {
  #colorCanvas: HTMLCanvasElement;
  #colorCtx: CanvasRenderingContext2D;
  #paletteCanvas: HTMLCanvasElement;
  #paletteCtx: CanvasRenderingContext2D;
  #grayCanvas: HTMLCanvasElement;
  #grayCtx: CanvasRenderingContext2D;

  #colorToIndex: { [hash: number]: number } = {};

  constructor(params: PaletteWorkspaceConstructorParams) {
    const ctxOpt = {
      willReadFrequently: true,
    };

    type Ctx = CanvasRenderingContext2D;

    this.#colorCanvas = params.colorCanvas;
    this.#colorCtx = this.#colorCanvas.getContext("2d", ctxOpt)! as Ctx;

    this.#paletteCanvas = params.paletteCanvas;
    this.#paletteCtx = this.#paletteCanvas.getContext("2d", ctxOpt)! as Ctx;

    this.#grayCanvas = params.grayCanvas;
    this.#grayCtx = this.#grayCanvas.getContext("2d", ctxOpt) as Ctx;

    this.#bindPaletteCanvasListeners();
  }

  #bindPaletteCanvasListeners() {
    let canvas = this.#paletteCanvas;

    let mouseX = 0;
    let mouseDown = false;

    const resolveMousePosition = (event: MouseEvent) => {
      const boundingRect = canvas.getBoundingClientRect();
      const inverseScale = 256 / boundingRect.width;

      mouseX = Math.floor((event.clientX - boundingRect.left) * inverseScale);
    };

    canvas.addEventListener("mousedown", (event) => {
      if (event.button != 0) {
        return;
      }

      resolveMousePosition(event);

      mouseDown = true;
    });

    document.body.addEventListener("mousemove", (event) => {
      if (!mouseDown) {
        return;
      }

      let oldX = mouseX;
      resolveMousePosition(event);
      let newX = mouseX;

      if (oldX == newX) {
        // no need to swap
        return;
      }

      const paletteData = this.#paletteCtx.getImageData(0, 0, 256, 1);

      // get old colors
      const oldOffset = oldX * 4;
      const newOffset = newX * 4;

      const oldR = paletteData.data[oldOffset];
      const oldG = paletteData.data[oldOffset + 1];
      const oldB = paletteData.data[oldOffset + 2];
      const oldA = paletteData.data[oldOffset + 3];
      const oldHash = hashColor(oldR, oldG, oldB, oldA);

      const newR = paletteData.data[newOffset];
      const newG = paletteData.data[newOffset + 1];
      const newB = paletteData.data[newOffset + 2];
      const newA = paletteData.data[newOffset + 3];
      const newHash = hashColor(newR, newG, newB, newA);

      // swap indices
      if (this.#colorToIndex[oldHash] == oldX) {
        this.#colorToIndex[oldHash] = newX;
      }

      if (this.#colorToIndex[newHash] == newX) {
        this.#colorToIndex[newHash] = oldX;
      }

      // swap colors
      paletteData.data[oldOffset] = newR;
      paletteData.data[oldOffset + 1] = newG;
      paletteData.data[oldOffset + 2] = newB;
      paletteData.data[oldOffset + 3] = newA;

      paletteData.data[newOffset] = oldR;
      paletteData.data[newOffset + 1] = oldG;
      paletteData.data[newOffset + 2] = oldB;
      paletteData.data[newOffset + 3] = oldA;

      this.#paletteCtx.clearRect(0, 0, 256, 1);
      this.#paletteCtx.putImageData(paletteData, 0, 0);

      // recreate grayscale
      this.#renderGrayscale();
    });

    document.body.addEventListener("mouseup", () => {
      mouseDown = false;
    });
  }

  loadImages(input: InputImages) {
    const image = input.image!;

    this.#colorCanvas.width = image.width;
    this.#colorCanvas.height = image.height;
    this.#grayCanvas.width = image.width;
    this.#grayCanvas.height = image.height;

    if (input.imageType == "color") {
      this.#colorCtx.drawImage(image, 0, 0);
    } else {
      this.#grayCtx.drawImage(image, 0, 0);
    }

    if (input.paletteImage) {
      this.#loadPalette(input.paletteImage);
    } else {
      this.#generatePalette();
    }

    if (input.imageType == "color") {
      this.#renderGrayscale();
    } else {
      this.#renderColor();
    }
  }

  #loadPalette(image: HTMLImageElement) {
    this.#paletteCtx.clearRect(0, 0, 256, 1);
    this.#paletteCtx.drawImage(image, 0, 0);
    const imageData = this.#paletteCtx.getImageData(0, 0, 256, 1);

    this.#colorToIndex = {};

    for (let i = 0; i < 256 * 4; i += 4) {
      const r = imageData.data[i];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];
      const a = imageData.data[i + 3];

      const hash = hashColor(r, g, b, a);

      if (this.#colorToIndex[hash] == undefined) {
        this.#colorToIndex[hash] = i / 4;
      }
    }
  }

  #generatePalette() {
    const width = this.#colorCanvas.width;
    const height = this.#colorCanvas.height;
    const imageData = this.#colorCtx.getImageData(0, 0, width, height);

    this.#colorToIndex = { [0]: 0 };
    let uniqueColors = 0;

    this.#paletteCtx.clearRect(0, 0, 256, 1);

    for (let i = 0; i < width * height * 4; i += 4) {
      const r = imageData.data[i];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];
      const a = imageData.data[i + 3];

      const hash = hashColor(r, g, b, a);

      if (hash != 0 && this.#colorToIndex[hash] == undefined) {
        uniqueColors += 1;
        this.#colorToIndex[hash] = uniqueColors;

        this.#paletteCtx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a / 255})`;
        this.#paletteCtx.fillRect(uniqueColors, 0, 1, 1);
      }
    }
  }

  #renderGrayscale() {
    const width = this.#colorCanvas.width;
    const height = this.#colorCanvas.height;
    const imageData = this.#colorCtx.getImageData(0, 0, width, height);

    for (let i = 0; i < width * height * 4; i += 4) {
      const r = imageData.data[i];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];
      const a = imageData.data[i + 3];

      const hash = hashColor(r, g, b, a);
      const colorIndex = this.#colorToIndex[hash];

      imageData.data[i] = colorIndex;
      imageData.data[i + 1] = colorIndex;
      imageData.data[i + 2] = colorIndex;
      imageData.data[i + 3] = colorIndex == 0 ? 0 : 255;
    }

    this.#grayCtx.clearRect(0, 0, width, height);
    this.#grayCtx.putImageData(imageData, 0, 0);
  }

  #renderColor() {
    const width = this.#colorCanvas.width;
    const height = this.#colorCanvas.height;
    const imageData = this.#grayCtx.getImageData(0, 0, width, height);
    const paletteData = this.#paletteCtx.getImageData(0, 0, 256, 1);

    for (let i = 0; i < width * height * 4; i += 4) {
      const colorI = imageData.data[i] * 4;

      imageData.data[i] = paletteData.data[colorI];
      imageData.data[i + 1] = paletteData.data[colorI + 1];
      imageData.data[i + 2] = paletteData.data[colorI + 2];
      imageData.data[i + 3] = paletteData.data[colorI + 3];
    }

    this.#colorCtx.clearRect(0, 0, width, height);
    this.#colorCtx.putImageData(imageData, 0, 0);
  }
}

function hashColor(r: number, g: number, b: number, a: number) {
  if (a == 0) {
    return 0;
  }

  return (r << 24) | (g << 16) | (b << 8) | a;
}
