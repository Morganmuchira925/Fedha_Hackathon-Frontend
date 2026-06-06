import { useState, useRef } from "react";
import {
  Mic,
  Square,
  UploadCloud,
  Info,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Wallet,
  FileText,
} from "lucide-react";
import { COLORS, KES, CATEGORY_ICONS, SOURCE_ICONS } from "../constants";
import {
  generateData,
  normalizeTransaction,
  uploadVoiceAudio,
  speak,
  renderCategoryIcon,
  renderSourceIcon,
} from "../utils";

const initialData = generateData();

export default function VoiceLogPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [voiceText, setVoiceText] = useState("");
  const [voiceStatus, setVoiceStatus] = useState("idle");
  const [parsedTxn, setParsedTxn] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [voiceUploadStatus, setVoiceUploadStatus] = useState("idle");
  const [voiceError, setVoiceError] = useState(null);
  const [recentTxns, setRecentTxns] = useState(
    initialData.transactions.slice(0, 8)
  );

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const voiceInputRef = useRef(null);

  const startVoiceRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setVoiceError(
        "Microphone recording is not supported in this browser."
      );
      setVoiceStatus("error");
      return;
    }

    setVoiceError(null);
    setParsedTxn(null);
    setVoiceText("");
    setVoiceUploadStatus("recording");
    setVoiceStatus("recording");
    setAudioUrl("");
    setAudioBlob(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setVoiceStatus("parsing");
        await uploadVoiceAudio(
          blob,
          "voice.webm",
          setParsedTxn,
          setVoiceText,
          setRecentTxns,
          setVoiceStatus,
          setVoiceUploadStatus,
          setVoiceError
        );
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      console.error(err);
      setVoiceError(
        "Could not access microphone. Verify connection settings and try again."
      );
      setIsRecording(false);
      setVoiceStatus("error");
      setVoiceUploadStatus("idle");
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current?.state !== "inactive") {
      mediaRecorderRef.current.stop();
    } else {
      setIsRecording(false);
      setVoiceStatus("idle");
    }
  };

  const handleVoiceFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setVoiceError(null);
    setVoiceStatus("parsing");
    await uploadVoiceAudio(
      file,
      file.name,
      setParsedTxn,
      setVoiceText,
      setRecentTxns,
      setVoiceStatus,
      setVoiceUploadStatus,
      setVoiceError
    );
  };

  return (
    <>
      <p style={{
        fontSize: 13,
        color: "var(--text-secondary)",
        marginBottom: "1.5rem",
        lineHeight: 1.5,
      }}>
        Record a localized voice transaction statement or upload an audio file.
        Gemini will automatically extract types, values, and categorizations.
      </p>

      <div style={{ display: "grid", gap: 16, marginBottom: "1.5rem" }}>
        <div style={{
          background: "var(--bg-secondary)",
          borderRadius: 14,
          padding: "18px",
          border: "1px solid var(--border-color)",
        }}>
          <p style={{ fontSize: 14, fontWeight: 600, margin: "0 0 12px" }}>
            Voice input command
          </p>
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            alignItems: "center",
          }}>
            <button
              onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                minWidth: 160,
                height: 44,
                borderRadius: 10,
                background: isRecording ? "#D85A30" : "#1D9E75",
                border: "none",
                color: "#fff",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
                boxShadow: isRecording
                  ? "0 8px 24px rgba(216,90,48,0.2)"
                  : "0 8px 24px rgba(29,158,117,0.15)",
                transition: "transform 0.1s active",
              }}
            >
              {isRecording ? (
                <Square className="w-4 h-4 fill-white" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
              {isRecording ? "Stop recording" : "Record audio"}
            </button>

            <label style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              minWidth: 160,
              height: 42,
              borderRadius: 10,
              background: "var(--bg-primary)",
              border: "1px solid var(--border-color)",
              color: "var(--text-primary)",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              padding: "0 14px",
              boxSizing: "border-box",
            }}>
              <UploadCloud className="w-4 h-4 text-slate-400" />
              Upload file
              <input
                ref={voiceInputRef}
                type="file"
                accept="audio/*"
                onChange={handleVoiceFileChange}
                style={{ display: "none" }}
              />
            </label>
          </div>

          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: 14,
            padding: "2px 4px",
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-tertiary)",
            }}>
              <Info className="w-3.5 h-3.5" />
            </div>
            <p style={{
              fontSize: 12,
              color: "var(--text-secondary)",
              margin: 0,
              lineHeight: 1.4,
            }}>
              {voiceStatus === "idle" &&
                "Tap record or upload an audio clip to parse a transaction."}
              {voiceStatus === "recording" &&
                "🔴 Recording session active... tap stop when finished."}
              {voiceStatus === "parsing" &&
                "✨ Analyzing vocal waveforms with Gemini parsing filters..."}
              {voiceStatus === "saved" &&
                "✅ Transaction successfully recognized and archived."}
              {voiceStatus === "error" &&
                "⚠️ Analytics failed. Please retry with a clearer vocal clip."}
            </p>
          </div>
        </div>

        {voiceError && (
          <div style={{
            background: "rgba(220,53,69,0.1)",
            border: "1px solid rgba(220,53,69,0.2)",
            borderRadius: 12,
            padding: "12px 14px",
            color: "#E45866",
            fontSize: 13,
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}>
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{voiceError}</span>
          </div>
        )}

        {audioUrl && (
          <div style={{
            background: "var(--bg-secondary)",
            borderRadius: 14,
            padding: "14px",
            border: "1px solid var(--border-color)",
          }}>
            <p style={{
              fontSize: 12,
              color: "var(--text-secondary)",
              margin: "0 0 10px",
              fontWeight: 500,
            }}>
              Recorded file playback
            </p>
            <audio
              controls
              src={audioUrl}
              style={{ width: "100%", height: 36 }}
            />
          </div>
        )}
      </div>

      {parsedTxn && (
        <div style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-color)",
          borderRadius: 16,
          padding: "16px",
          marginBottom: "1rem",
        }}>
          <p style={{ fontSize: 14, fontWeight: 600, margin: "0 0 14px" }}>
            Saved transaction output
          </p>
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            marginBottom: 14,
          }}>
            {[
              [
                "Type",
                parsedTxn.type === "income" ? "Income" : "Expense",
                parsedTxn.type === "income" ? TrendingUp : TrendingDown,
                parsedTxn.type === "income" ? "#1D9E75" : "#D85A30",
              ],
              ["Amount", KES(parsedTxn.amount), Wallet],
              [
                "Category",
                parsedTxn.category,
                CATEGORY_ICONS[parsedTxn.category] || Package,
              ],
              [
                "Source",
                parsedTxn.source.replace("_", " "),
                SOURCE_ICONS[parsedTxn.source] || FileText,
              ],
            ].map(([k, v, SubIcon, color]) => (
              <div
                key={k}
                style={{
                  background: "var(--bg-primary)",
                  border: "1px solid var(--border-color)",
                  borderRadius: 10,
                  padding: "10px 12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <span style={{
                  fontSize: 11,
                  color: "var(--text-tertiary)",
                  fontWeight: 500,
                }}>
                  {k}
                </span>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}>
                  {SubIcon && (
                    <SubIcon
                      style={{
                        width: 14,
                        height: 14,
                        color: color || "var(--text-secondary)",
                      }}
                    />
                  )}
                  <span style={{
                    fontSize: 13,
                    fontWeight: 600,
                    textTransform: "capitalize",
                    color: color || "var(--text-primary)",
                  }}>
                    {v}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <p style={{
            fontSize: 11,
            color: "var(--text-tertiary)",
            fontWeight: 500,
            margin: "0 0 4px",
          }}>
            Extracted statement description
          </p>
          <div style={{
            background: "var(--bg-primary)",
            border: "1px solid var(--border-color)",
            borderRadius: 8,
            padding: "10px 12px",
          }}>
            <p style={{
              fontSize: 13,
              margin: 0,
              fontStyle: "italic",
              lineHeight: 1.4,
            }}>
              "{parsedTxn.description}"
            </p>
          </div>
        </div>
      )}
    </>
  );
}
