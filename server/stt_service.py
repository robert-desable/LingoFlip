import sys
import io
import json
import os
from http.server import HTTPServer, BaseHTTPRequestHandler

# Set utf-8 encoding for standard output
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

print("[STT Server] Initializing faster-whisper neural engine...", flush=True)

try:
    from faster_whisper import WhisperModel
    # Use 'base' model with int8 quantization for ultra-fast CPU inference (< 300ms)
    MODEL_SIZE = os.environ.get("WHISPER_MODEL", "base")
    print(f"[STT Server] Preloading '{MODEL_SIZE}' Whisper model into RAM...", flush=True)
    whisper_model = WhisperModel(MODEL_SIZE, device="cpu", compute_type="int8")
    print(f"[STT Server] '{MODEL_SIZE}' model preloaded successfully! Engine is ready.", flush=True)
except Exception as e:
    print(f"[STT Server Error] Failed to load faster-whisper: {e}", file=sys.stderr, flush=True)
    whisper_model = None

class STTRequestHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/health":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "ready" if whisper_model else "error"}).encode("utf-8"))
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        if self.path == "/transcribe":
            content_length = int(self.headers.get("Content-Length", 0))
            if content_length <= 0:
                self.send_response(400)
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "text": "", "error": "Empty body"}).encode("utf-8"))
                return

            post_data = self.rfile.read(content_length)

            if not whisper_model:
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "text": "", "error": "Model not loaded"}).encode("utf-8"))
                return

            try:
                audio_stream = io.BytesIO(post_data)
                
                # Transcribe with Hindi context prompt to ensure spot-on accuracy
                segments, info = whisper_model.transcribe(
                    audio_stream,
                    language="hi",
                    beam_size=5,
                    initial_prompt="कक्षा में शिक्षक हिंदी में बोल रहे हैं।",
                    vad_filter=True,
                    vad_parameters=dict(min_silence_duration_ms=400)
                )

                text_parts = [segment.text.strip() for segment in segments if segment.text.strip()]
                final_text = " ".join(text_parts).strip()

                print(f"[STT Server Recognized]: \"{final_text}\"", flush=True)

                response_body = json.dumps({
                    "success": True,
                    "text": final_text,
                    "language": info.language,
                    "probability": info.language_probability
                }).encode("utf-8")

                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Content-Length", str(len(response_body)))
                self.end_headers()
                self.wfile.write(response_body)

            except Exception as ex:
                print(f"[STT Transcription Error]: {ex}", file=sys.stderr, flush=True)
                err_resp = json.dumps({"success": False, "text": "", "error": str(ex)}).encode("utf-8")
                self.send_response(500)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(err_resp)
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        # Suppress noisy HTTP access logs
        return

def run_server(port=5005):
    server_address = ("127.0.0.1", port)
    httpd = HTTPServer(server_address, STTRequestHandler)
    print(f"[STT Server] Neural speech recognition server listening on http://127.0.0.1:{port}", flush=True)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        httpd.server_close()

if __name__ == "__main__":
    port = 5005
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            pass
    run_server(port)
