import { useEffect, useMemo, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { DecodeHintType, BarcodeFormat } from "@zxing/library";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

const ScanCode = () => {
  const [hasCamera, setHasCamera] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const codeReader = useRef<BrowserMultiFormatReader | null>(null);

  const { toast } = useToast();

  // ✅ Proper hints
  const hints = useMemo(() => {
    const map = new Map();
    map.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.QR_CODE,
      BarcodeFormat.AZTEC,
    ]);
    return map;
  }, []);

  // ✅ Initialize reader
  useEffect(() => {
    codeReader.current = new BrowserMultiFormatReader(hints);

    return () => {
      // 🔥 FIX: TypeScript-safe reset
      if (codeReader.current) {
        try {
          (codeReader.current as unknown as { stopContinuousDecode?: () => void })?.stopContinuousDecode?.();
        } catch {
          console.warn("Reset not supported");
        }
      }
    };
  }, [hints]);

  // ✅ Check camera availability
  useEffect(() => {
    const checkCamera = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((d) => d.kind === "videoinput");
        setHasCamera(videoDevices.length > 0);
      } catch {
        setHasCamera(false);
      }
    };

    checkCamera();
  }, []);

  // ✅ Start scanning
  const startScan = async () => {
    setError("");
    setResult("");

    if (!codeReader.current || !videoRef.current) {
      setError("Scanner not initialized.");
      return;
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === "videoinput");

      if (videoDevices.length === 0) {
        setError("No camera found.");
        return;
      }

      const selectedDeviceId = videoDevices[0].deviceId;

      setIsScanning(true);

      codeReader.current.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current,
        (res, err) => {
          if (res) {
            const text = res.getText();
            setResult(text);

            toast({
              title: "Scan successful",
              description: text,
            });

            stopScan();
          }

          if (err && err.name !== "NotFoundException") {
            console.error(err);
            setError("Scan failed. Try again.");
          }
        }
      );
    } catch (err) {
      console.error(err);
      setError("Camera access failed.");
    }
  };

  // ✅ Stop scanning (safe)
  const stopScan = () => {
    try {
      (codeReader.current as unknown as { stopContinuousDecode?: () => void })?.stopContinuousDecode?.();
    } catch {
      console.warn("Stop failed");
    }
    setIsScanning(false);
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Scan QR/Barcode</h1>

      {hasCamera ? (
        <div className="grid gap-3">
          <video
            ref={videoRef}
            className="w-full h-80 rounded-lg border object-cover"
            muted
            autoPlay
          />

          <div className="flex gap-2">
            <Button onClick={startScan} disabled={isScanning}>
              {isScanning ? "Scanning..." : "Start Scan"}
            </Button>

            <Button
              onClick={stopScan}
              disabled={!isScanning}
              variant="secondary"
            >
              Stop
            </Button>
          </div>

          {result && (
            <div className="p-4 border rounded-lg">
              <p className="font-semibold">Result:</p>
              <p className="break-words">{result}</p>
            </div>
          )}

          {error && <p className="text-red-500">{error}</p>}
        </div>
      ) : (
        <p>No camera detected</p>
      )}
    </div>
  );
};

export default ScanCode;