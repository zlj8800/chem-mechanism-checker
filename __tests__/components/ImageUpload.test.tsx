import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import ImageUpload from "@/components/ImageUpload";

jest.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    ...props
  }: React.PropsWithChildren<{ onClick?: () => void }>) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

jest.mock("lucide-react", () => ({
  Upload: () => <span data-testid="upload-icon">Upload</span>,
  X: () => <span data-testid="x-icon">X</span>,
  Image: () => <span data-testid="image-icon">Image</span>,
}));

describe("ImageUpload", () => {
  it("renders upload zone when no image is selected", () => {
    render(
      <ImageUpload
        onImageSelect={jest.fn()}
        currentImage={null}
        onClear={jest.fn()}
      />
    );

    expect(
      screen.getByText("Drag & drop an image, or click to browse")
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Upload a photo of your handwritten mechanism or a screenshot"
      )
    ).toBeInTheDocument();
  });

  it("renders preview when an image is selected", () => {
    render(
      <ImageUpload
        onImageSelect={jest.fn()}
        currentImage="data:image/png;base64,testImageData"
        onClear={jest.fn()}
      />
    );

    const img = screen.getByAltText("Uploaded mechanism");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute(
      "src",
      "data:image/png;base64,testImageData"
    );
  });

  it("calls onClear when X button is clicked on preview", () => {
    const onClear = jest.fn();
    render(
      <ImageUpload
        onImageSelect={jest.fn()}
        currentImage="data:image/png;base64,test"
        onClear={onClear}
      />
    );

    const clearButton = screen.getByTestId("x-icon").closest("button");
    if (clearButton) {
      fireEvent.click(clearButton);
      expect(onClear).toHaveBeenCalled();
    }
  });

  it("has a hidden file input", () => {
    const { container } = render(
      <ImageUpload
        onImageSelect={jest.fn()}
        currentImage={null}
        onClear={jest.fn()}
      />
    );

    const input = container.querySelector('input[type="file"]');
    expect(input).toBeInTheDocument();
    expect(input).toHaveClass("hidden");
    expect(input).toHaveAttribute("accept", "image/*");
  });

  it("changes text during drag over", () => {
    render(
      <ImageUpload
        onImageSelect={jest.fn()}
        currentImage={null}
        onClear={jest.fn()}
      />
    );

    const dropZone = screen
      .getByText("Drag & drop an image, or click to browse")
      .closest("div[class*='border-dashed']")!;

    fireEvent.dragOver(dropZone, {
      preventDefault: jest.fn(),
      dataTransfer: { files: [] },
    });

    expect(screen.getByText("Drop your image here")).toBeInTheDocument();
  });
});
