import { loadImageFile } from "./file-loading";
import { InputImages, resolveSingleErrorMessage } from "./input-images";
import PaletteWorkspace from "./palette-workspace";

const imageTypeDialogElement = document.getElementById(
  "image-type-dialog"
) as HTMLDialogElement;

const workspace = new PaletteWorkspace({
  paletteCanvas: document.getElementById("palette") as HTMLCanvasElement,
  colorCanvas: document.getElementById("color") as HTMLCanvasElement,
  grayCanvas: document.getElementById("grayscale") as HTMLCanvasElement,
});

const pendingImages: InputImages = {};

function logError(error: string) {
  console.error(error);
  alert(error);
}

document.body.addEventListener("dragover", (event) => event.preventDefault());
document.body.addEventListener("drop", (event) => {
  const items = event.dataTransfer?.items;

  if (!items) {
    return;
  }

  event.preventDefault();

  const files: File[] = [];

  for (const item of items) {
    const file = item.getAsFile();

    if (file) {
      files.push(file);
    }
  }

  loadFiles(files)
    .catch(logError)
    .finally(() => {
      tryLoadPending();
    });
});

function tryLoadPending() {
  const errorMessage = resolveSingleErrorMessage(pendingImages);

  const errorElement = document.getElementById("error")! as HTMLDivElement;

  errorElement.innerText = errorMessage || "";

  if (!errorMessage && pendingImages.imageType) {
    workspace.loadImages(pendingImages);
    // reset palette image
    pendingImages.paletteImage = undefined;
  }
}

async function loadFiles(files: File[]) {
  for (const file of files) {
    if (file.name.endsWith(".png")) {
      try {
        const image = await loadImageFile(file);

        if (image.height == 1 && image.width == 256) {
          pendingImages.paletteImage = image;
        } else {
          pendingImages.image = image;
          pendingImages.imageType = undefined;
        }

        pendingImages.imageError = undefined;
      } catch (error) {
        console.error(error);
        pendingImages.imageError = error!.toString();
      }
    }
  }

  if (pendingImages.image && !pendingImages.imageType) {
    imageTypeDialogElement.show();
  }
}

function createImageTypeSetter(type: "color" | "grayscale") {
  return function () {
    pendingImages.imageType = type;
    imageTypeDialogElement.close();
    tryLoadPending();
  };
}

document.getElementById("set-color")!.onclick = createImageTypeSetter("color");

document.getElementById("set-grayscale")!.onclick =
  createImageTypeSetter("grayscale");
