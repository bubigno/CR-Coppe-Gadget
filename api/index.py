import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.server import app  # noqa: E402,F401 — ASGI app per il runtime Python di Vercel