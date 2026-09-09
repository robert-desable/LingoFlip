import sys
import os
import speech_recognition as sr

def transcribe(wav_path, lang="hi-IN"):
    if not os.path.exists(wav_path):
        sys.stderr.write(f"File not found: {wav_path}\n")
        return ""
    
    r = sr.Recognizer()
    try:
        with sr.AudioFile(wav_path) as source:
            audio = r.record(source)
        text = r.recognize_google(audio, language=lang)
        return text.strip()
    except sr.UnknownValueError:
        # No speech detected
        return ""
    except Exception as e:
        sys.stderr.write(f"Transcription error: {e}\n")
        return ""

if __name__ == "__main__":
    if len(sys.argv) > 1:
        file_path = sys.argv[1]
        language = sys.argv[2] if len(sys.argv) > 2 else "hi-IN"
        recognized = transcribe(file_path, language)
        # Ensure utf-8 output in Windows console
        try:
            sys.stdout.buffer.write(recognized.encode("utf-8"))
        except Exception:
            print(recognized)
    else:
        print("")
