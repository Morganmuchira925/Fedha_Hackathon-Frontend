import { useState, useRef } from "react";
import {
  Camera,
  FileText,
  ScanBarcode,
  Search,
  AlertTriangle,
} from "lucide-react";
import { KES } from "../constants";
import { uploadReceiptPhoto, lookupBarcode } from "../utils";
import { useAuth } from "@clerk/clerk-react";

export default function ReceiptsPage() {
  const [scanMode, setScanMode] = useState("idle");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [barcodeResult, setBarcodeResult] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptUploadStatus, setReceiptUploadStatus] = useState("idle");
  const [receiptScanResult, setReceiptScanResult] = useState(null);
  const [receiptError, setReceiptError] = useState(null);

  const receiptInputRef = useRef(null);

  const handleReceiptFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await uploadReceiptPhoto(
      file,
      setReceiptError,
      setReceiptScanResult,
      setReceiptUploadStatus,
      setReceiptFile
    );
  };

  const { getToken } = useAuth();

  return (
    <>
      <p style={{
        fontSize: 13,
        color: "var(--text-secondary)",
        marginBottom: "1.5rem",
        lineHeight: 1.5,
      }}>
        Scan transactional receipts or type barcode metrics. Gemini Vision
        parses item grids, balances, and global codes natively.
      </p>

      {/* Dropzone container layout */}
      <div style={{
        background: "var(--bg-secondary)",
        border: "1.5px dashed var(--border-color)",
        borderRadius: 16,
        padding: "2.25rem 1.5rem",
        textAlign: "center",
        marginBottom: "1.5rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: "rgba(55,138,221,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#378ADD",
          marginBottom: 12,
        }}>
          <Camera className="w-5 h-5" />
        </div>
        <p style={{ fontSize: 14, fontWeight: 600, margin: "0 0 4px" }}>
          Upload receipt image
        </p>
        <p style={{
          fontSize: 12,
          color: "var(--text-tertiary)",
          margin: "0 0 16px",
        }}>
          JPG, PNG, WEBP processing up to 10MB
        </p>
        <button
          onClick={() => receiptInputRef.current?.click()}
          style={{
            background: "#378ADD",
            border: "none",
            borderRadius: 8,
            padding: "8px 20px",
            color: "#fff",
            fontSize: 13,
            cursor: "pointer",
            fontWeight: 600,
            boxShadow: "0 4px 12px rgba(55,138,221,0.2)",
          }}
        >
          Choose file
        </button>
        <input
          ref={receiptInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleReceiptFileChange}
        />
      </div>

      {receiptError && (
        <div style={{
          background: "rgba(216,90,48,0.1)",
          border: "1px solid rgba(216,90,48,0.2)",
          borderRadius: 12,
          padding: "12px 14px",
          color: "#D85A30",
          fontSize: 13,
          marginBottom: "1.5rem",
        }}>
          {receiptError}
        </div>
      )}

      {/* Structured Scan results output */}
      {receiptScanResult && (
        <div style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-color)",
          borderRadius: 16,
          padding: "16px",
          marginBottom: "1.5rem",
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 12,
          }}>
            <FileText className="w-4 h-4 text-slate-400" />
            <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>
              Receipt compilation overview
            </p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            marginBottom: 12,
          }}>
            <div style={{
              background: "var(--bg-primary)",
              border: "1px solid var(--border-color)",
              borderRadius: 10,
              padding: "10px 12px",
            }}>
              <p style={{
                fontSize: 11,
                color: "var(--text-tertiary)",
                margin: "0 0 4px",
                fontWeight: 500,
              }}>
                Vendor / Store
              </p>
              <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>
                {receiptScanResult.parsed?.vendor || "Unknown Sourcing"}
              </p>
            </div>
            <div style={{
              background: "var(--bg-primary)",
              border: "1px solid var(--border-color)",
              borderRadius: 10,
              padding: "10px 12px",
            }}>
              <p style={{
                fontSize: 11,
                color: "var(--text-tertiary)",
                margin: "0 0 4px",
                fontWeight: 500,
              }}>
                Total Balance
              </p>
              <p style={{
                fontSize: 13,
                fontWeight: 600,
                margin: 0,
                color: "#1D9E75",
              }}>
                {receiptScanResult.parsed?.total != null
                  ? KES(receiptScanResult.parsed.total)
                  : "Unknown"}
              </p>
            </div>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 8,
            fontSize: 12,
          }}>
            <div style={{
              background: "var(--bg-primary)",
              border: "1px solid var(--border-color)",
              borderRadius: 10,
              padding: "10px",
              textAlign: "center",
            }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>
                {receiptScanResult.barcodeCount || 0}
              </p>
              <p style={{
                margin: "2px 0 0",
                color: "var(--text-secondary)",
                fontSize: 11,
              }}>
                Barcodes
              </p>
            </div>
            <div style={{
              background: "var(--bg-primary)",
              border: "1px solid var(--border-color)",
              borderRadius: 10,
              padding: "10px",
              textAlign: "center",
            }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>
                {receiptScanResult.parsed?.lineItems?.length || 0}
              </p>
              <p style={{
                margin: "2px 0 0",
                color: "var(--text-secondary)",
                fontSize: 11,
              }}>
                Line Items
              </p>
            </div>
            <div style={{
              background: "var(--bg-primary)",
              border: "1px solid var(--border-color)",
              borderRadius: 10,
              padding: "10px",
              textAlign: "center",
            }}>
              <p style={{
                margin: 0,
                fontWeight: 700,
                fontSize: 13,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}>
                {receiptScanResult.parsed?.date || "-"}
              </p>
              <p style={{
                margin: "2px 0 0",
                color: "var(--text-secondary)",
                fontSize: 11,
              }}>
                Date
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Barcode tracking component block */}
      <div style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-color)",
        borderRadius: 14,
        padding: "16px",
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 4,
        }}>
          <ScanBarcode className="w-4 h-4 text-slate-400" />
          <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>
            Barcode product lookup
          </p>
        </div>
        <p style={{
          fontSize: 12,
          color: "var(--text-secondary)",
          margin: "0 0 12px",
          lineHeight: 1.4,
        }}>
          Input dynamic barcode parameters directly to verify stock attributes.
          (Supports EAN-13, EAN-8).
        </p>

        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <div style={{
            position: "relative",
            flex: 1,
            display: "flex",
            alignItems: "center",
          }}>
            <Search style={{
              width: 14,
              height: 14,
              position: "absolute",
              left: 10,
              color: "var(--text-tertiary)",
            }} />
            <input
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="e.g. 6141234567890"
              style={{
                width: "100%",
                padding: "8px 12px 8px 30px",
                boxSizing: "border-box",
                borderRadius: 8,
                fontSize: 13,
                border: "1px solid var(--border-color)",
                background: "var(--bg-primary)",
                color: "var(--text-primary)",
              }}
              onKeyDown={(e) =>
                e.key === "Enter" &&
                lookupBarcode(barcodeInput, setScanMode, setBarcodeResult)
              }
            />
          </div>
          <button
            onClick={() =>
              lookupBarcode(barcodeInput, setScanMode, setBarcodeResult, getToken)
            }
            disabled={scanMode === "loading" || !barcodeInput.trim()}
            style={{
              background: "#378ADD",
              border: "none",
              borderRadius: 8,
              padding: "0 16px",
              color: "#fff",
              fontSize: 13,
              cursor: "pointer",
              fontWeight: 600,
              height: 34,
            }}
          >
            {scanMode === "loading" ? "..." : "Look up"}
          </button>
        </div>

        <div style={{
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
          marginBottom: 12,
        }}>
          {[
            ["6141234567890", "Brookside Milk"],
            ["6141000000001", "Unga Maize"],
            ["5000159407236", "Nescafé"],
          ].map(([code, label]) => (
            <button
              key={code}
              onClick={() => setBarcodeInput(code)}
              style={{
                background: "var(--bg-primary)",
                border: "1px solid var(--border-color)",
                borderRadius: 20,
                padding: "4px 12px",
                fontSize: 11,
                cursor: "pointer",
                color: "var(--text-secondary)",
                fontWeight: 500,
                transition: "background 0.15s",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {barcodeResult && (
          <div style={{
            background: barcodeResult.identified
              ? "rgba(29,158,117,0.1)"
              : "var(--bg-primary)",
            border: barcodeResult.identified
              ? "1px solid rgba(29,158,117,0.15)"
              : "1px solid var(--border-color)",
            borderRadius: 10,
            padding: "12px",
          }}>
            {barcodeResult.identified ? (
              <div>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}>
                  <p style={{
                    fontSize: 13,
                    fontWeight: 700,
                    margin: 0,
                    color: "var(--text-primary)",
                  }}>
                    {barcodeResult.productName}
                  </p>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 600,
                    background: "rgba(29,158,117,0.2)",
                    color: "#1D9E75",
                    padding: "2px 8px",
                    borderRadius: 20,
                  }}>
                    Identified
                  </span>
                </div>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 6,
                  fontSize: 12,
                  color: "var(--text-secondary)",
                }}>
                  {barcodeResult.brand && (
                    <span>
                      Brand:{" "}
                      <strong style={{ color: "var(--text-primary)" }}>
                        {barcodeResult.brand}
                      </strong>
                    </span>
                  )}
                  {barcodeResult.category && (
                    <span>
                      Category:{" "}
                      <strong style={{ color: "var(--text-primary)" }}>
                        {barcodeResult.category}
                      </strong>
                    </span>
                  )}
                  {barcodeResult.typicalPriceKES != null && (
                    <span>
                      Price:{" "}
                      <strong style={{ color: "#1D9E75" }}>
                        KES {barcodeResult.typicalPriceKES}
                      </strong>
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div style={{
                display: "flex",
                gap: 6,
                alignItems: "center",
                color: "var(--text-secondary)",
              }}>
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <p style={{ fontSize: 12.5, margin: 0 }}>
                  Product not identified.{" "}
                  {barcodeResult.notes ||
                    "Try a different item reference allocation."}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Standard specifications info row */}
      <div style={{
        marginTop: "12px",
        padding: "12px",
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-color)",
        borderRadius: 12,
      }}>
        <p style={{ fontSize: 12, fontWeight: 600, margin: "0 0 8px" }}>
          Supported prefix protocols
        </p>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "6px 12px",
          fontSize: 11.5,
          color: "var(--text-secondary)",
        }}>
          {[
            ["EAN-13", "Global retail (614 = KE)"],
            ["EAN-8", "Compact retail lines"],
            ["Code-128", "Logistics structures"],
            ["QR Code", "Digital receipt records"],
          ].map(([t, d]) => (
            <div
              key={t}
              style={{
                display: "flex",
                justifyContent: "space-between",
                borderBottom: "1px dashed var(--border-color)",
                paddingBottom: 2,
              }}
            >
              <span style={{
                fontWeight: 600,
                color: "var(--text-primary)",
              }}>
                {t}
              </span>
              <span>{d}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
