/**
 * ImageUploader component tests
 * Run: npx jest __tests__/components/ImageUploader.test.tsx
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ImageUploader from "@/components/admin/ImageUploader";
import * as uploadService from "@/services/upload-service";

// Mock i18next
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts?.mb) return `File exceeds the ${opts.mb} MB limit`;
      if (opts?.name) return `Remove ${opts.name} from queue`;
      return key;
    },
  }),
}));

// Mock the upload service
jest.mock("@/services/upload-service", () => ({
  uploadProductImagesAPI: jest.fn(),
}));

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => "blob:mock-url");
global.URL.revokeObjectURL = jest.fn();

// Mock next/image
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={props.src} alt={props.alt} />
  ),
}));

const mockOnUploaded = jest.fn();

describe("ImageUploader", () => {
  const defaultProps = {
    productId: "507f1f77bcf86cd799439011",
    onUploaded: mockOnUploaded,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders without crashing", () => {
    render(<ImageUploader {...defaultProps} />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("shows drop zone with correct aria label", () => {
    render(<ImageUploader {...defaultProps} />);
    expect(screen.getByLabelText("upload.dropZoneAriaLabel")).toBeInTheDocument();
  });

  it("shows empty upload queue initially", () => {
    render(<ImageUploader {...defaultProps} />);
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("rejects files with invalid MIME type", async () => {
    render(<ImageUploader {...defaultProps} />);
    const input = document.querySelector("input[type='file']") as HTMLInputElement;
    const invalidFile = new File(["content"], "document.pdf", { type: "application/pdf" });
    Object.defineProperty(input, "files", { value: [invalidFile] });
    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText("upload.errorFileType")).toBeInTheDocument();
    });
  });

  it("shows upload queue after selecting valid files", async () => {
    (uploadService.uploadProductImagesAPI as jest.Mock).mockResolvedValue({
      data: {
        images: [{
          original: "/uploads/products/id/img-original.jpg",
          thumbnail: "/uploads/products/id/img-thumbnail.webp",
          medium: "/uploads/products/id/img-medium.webp",
          large: "/uploads/products/id/img-large.webp",
        }],
      },
    });

    render(<ImageUploader {...defaultProps} />);
    const input = document.querySelector("input[type='file']") as HTMLInputElement;
    const validFile = new File(["image"], "photo.jpg", { type: "image/jpeg" });
    Object.defineProperty(input, "files", { value: [validFile] });
    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByRole("list")).toBeInTheDocument();
      expect(screen.getByText("photo.jpg")).toBeInTheDocument();
    });
  });

  it("calls onUploaded after successful upload", async () => {
    const mockImages = [{
      original: "/uploads/products/id/img-original.jpg",
      thumbnail: "/uploads/products/id/img-thumbnail.webp",
      medium: "/uploads/products/id/img-medium.webp",
      large: "/uploads/products/id/img-large.webp",
    }];

    (uploadService.uploadProductImagesAPI as jest.Mock).mockResolvedValue({
      data: { images: mockImages },
    });

    render(<ImageUploader {...defaultProps} />);
    const input = document.querySelector("input[type='file']") as HTMLInputElement;
    const validFile = new File(["image"], "photo.jpg", { type: "image/jpeg" });
    Object.defineProperty(input, "files", { value: [validFile] });
    fireEvent.change(input);

    await waitFor(() => {
      expect(mockOnUploaded).toHaveBeenCalledWith(mockImages);
    });
  });

  it("shows error state when upload fails", async () => {
    (uploadService.uploadProductImagesAPI as jest.Mock).mockRejectedValue(
      new Error("Upload failed. Please try again.")
    );

    render(<ImageUploader {...defaultProps} />);
    const input = document.querySelector("input[type='file']") as HTMLInputElement;
    const validFile = new File(["image"], "photo.jpg", { type: "image/jpeg" });
    Object.defineProperty(input, "files", { value: [validFile] });
    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });

  it("shows done state after successful upload", async () => {
    (uploadService.uploadProductImagesAPI as jest.Mock).mockResolvedValue({
      data: { images: [{ original: "/a", thumbnail: "/b", medium: "/c", large: "/d" }] },
    });

    render(<ImageUploader {...defaultProps} />);
    const input = document.querySelector("input[type='file']") as HTMLInputElement;
    const validFile = new File(["image"], "photo.jpg", { type: "image/jpeg" });
    Object.defineProperty(input, "files", { value: [validFile] });
    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText("upload.statusDone")).toBeInTheDocument();
    });
  });
});
