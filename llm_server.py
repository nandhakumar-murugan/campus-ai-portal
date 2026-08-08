import sys
import os
import json
import torch

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from http.server import HTTPServer, BaseHTTPRequestHandler
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline

MODEL_NAME = "Qwen/Qwen2.5-0.5B-Instruct"

print("=======================================================")
print(f"[+] LOADING REAL NEURAL LLM MODEL: {MODEL_NAME}")
print("=======================================================")

try:
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    model = AutoModelForCausalLM.from_pretrained(MODEL_NAME, torch_dtype=torch.float32)
    pipe = pipeline("text-generation", model=model, tokenizer=tokenizer, max_new_tokens=150)
    print("[+] REAL NEURAL LLM MODEL LOADED INTO SYSTEM RAM SUCCESSFULLY!")
except Exception as e:
    print("[-] Model load error:", e)
    sys.exit(1)

class LLMRequestHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        
        try:
            req_json = json.loads(post_data.decode('utf-8'))
            prompt = req_json.get('prompt', 'Hello')
            
            messages = [
                {"role": "system", "content": "You are a helpful AI assistant running on the campus supercomputer."},
                {"role": "user", "content": prompt}
            ]
            
            formatted_prompt = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
            output = pipe(formatted_prompt, do_sample=True, temperature=0.7, top_p=0.9, pad_token_id=tokenizer.eos_token_id)
            
            full_out = output[0]['generated_text'] if output and 'generated_text' in output[0] else ""
            generated_text = full_out[len(formatted_prompt):].strip() if len(full_out) > len(formatted_prompt) else full_out.strip()

            response_body = json.dumps({
                "model": MODEL_NAME,
                "response": generated_text,
                "done": True
            }).encode('utf-8')

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(response_body)

        except Exception as err:
            self.send_response(500)
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(err)}).encode('utf-8'))

    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({"models": [{"name": MODEL_NAME}]}).encode('utf-8'))

    def log_message(self, format, *args):
        return

if __name__ == '__main__':
    server_address = ('127.0.0.1', 11434)
    httpd = HTTPServer(server_address, LLMRequestHandler)
    print(f"[+] REAL NEURAL LLM SERVER ACTIVE ON 127.0.0.1:11434")
    httpd.serve_forever()
