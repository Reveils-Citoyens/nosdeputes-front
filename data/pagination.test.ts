import { describe, it, expect, vi } from "vitest";
import { extractPaginationMetadata, PaginationMetadata } from "./pagination";

describe("extractPaginationMetadata", () => {
  it("should extract pagination metadata from response headers", () => {
    const mockHeaders = new Headers();
    mockHeaders.set("total", "100");
    mockHeaders.set("total-page", "10");
    mockHeaders.set("per-page", "10");

    const mockResponse = {
      headers: mockHeaders,
    } as Response;

    const result = extractPaginationMetadata(mockResponse, 1);

    expect(result).toEqual({
      total: 100,
      totalPage: 10,
      perPage: 10,
      currentPage: 1,
    });
  });

  it("should handle missing headers by defaulting to 0", () => {
    const mockHeaders = new Headers();
    const mockResponse = {
      headers: mockHeaders,
    } as Response;

    const result = extractPaginationMetadata(mockResponse, 2);

    expect(result).toEqual({
      total: 0,
      totalPage: 0,
      perPage: 0,
      currentPage: 2,
    });
  });

  it("should handle partial headers", () => {
    const mockHeaders = new Headers();
    mockHeaders.set("total", "50");
    // total-page and per-page missing

    const mockResponse = {
      headers: mockHeaders,
    } as Response;

    const result = extractPaginationMetadata(mockResponse, 3);

    expect(result).toEqual({
      total: 50,
      totalPage: 0,
      perPage: 0,
      currentPage: 3,
    });
  });

  it("should parse string numbers correctly", () => {
    const mockHeaders = new Headers();
    mockHeaders.set("total", "250");
    mockHeaders.set("total-page", "25");
    mockHeaders.set("per-page", "10");

    const mockResponse = {
      headers: mockHeaders,
    } as Response;

    const result = extractPaginationMetadata(mockResponse, 5);

    expect(result.total).toBe(250);
    expect(result.totalPage).toBe(25);
    expect(result.perPage).toBe(10);
    expect(result.currentPage).toBe(5);
  });

  it("should handle invalid header values gracefully", () => {
    const mockHeaders = new Headers();
    mockHeaders.set("total", "invalid");
    mockHeaders.set("total-page", "not-a-number");
    mockHeaders.set("per-page", "10");

    const mockResponse = {
      headers: mockHeaders,
    } as Response;

    const result = extractPaginationMetadata(mockResponse, 1);

    expect(result.total).toBeNaN();
    expect(result.totalPage).toBeNaN();
    expect(result.perPage).toBe(10);
    expect(result.currentPage).toBe(1);
  });
});
