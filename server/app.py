"""
FeedbackAI — Flask API Server
Provides chat, highlights, settings, and conversation log endpoints.
Falls back to demo mode when ANTHROPIC_API_KEY is not set.
"""

import os, uuid
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from chat import get_chat_response, classify_message
from feedback import ESSAY_PARAGRAPHS, RUBRIC_AREAS

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173", "http://localhost:3000"])

# ── In-Memory Storage ────────────────────────────────────────────────

settings = {
    "feedback_types": {"organization": True, "clarity": True, "evidence": True, "critical_thinking": True},
    "guardrails": {"block_answers": True, "log_conversations": True, "flag_excessive_usage": True, "max_messages_per_session": 15},
}

conversation_logs = [
    {"id": "log-1", "student": "Alex Chen", "time": "1:45 PM", "rubric": None, "msg": "Write this paragraph for me", "flagged": True, "resolved": False},
    {"id": "log-2", "student": "Maya Rodriguez", "time": "1:30 PM", "rubric": "Clarity", "msg": "Is my thesis clear enough?", "flagged": False, "resolved": False},
    {"id": "log-3", "student": "Jordan Lee", "time": "12:55 PM", "rubric": "Critical Thinking", "msg": "How do I address counterarguments?", "flagged": False, "resolved": False},
    {"id": "log-4", "student": "Alex Chen", "time": "12:40 PM", "rubric": None, "msg": "Just give me the answer", "flagged": True, "resolved": False},
    {"id": "log-5", "student": "Sam Patel", "time": "11:20 AM", "rubric": "Organization", "msg": "Help me restructure section 2", "flagged": False, "resolved": False},
]

stats = {"active_students": 24, "conversations_today": 47,
    "rubric_engagement": {"Organization": 72, "Clarity": 58, "Evidence": 85, "Critical Thinking": 44}}


@app.route("/api/mode")
def get_mode():
    has_key = bool(os.environ.get("ANTHROPIC_API_KEY"))
    return jsonify({"mode": "live" if has_key else "demo"})

@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json()
    message = data.get("message", "").strip()
    history = data.get("history", [])
    if not message:
        return jsonify({"error": "Message is required"}), 400

    response = get_chat_response(message, history, settings)
    category = classify_message(message)
    log_entry = {
        "id": f"log-{uuid.uuid4().hex[:8]}", "student": "Finn Murphy",
        "time": datetime.now().strftime("%-I:%M %p"), "rubric": response.get("rubric"),
        "msg": message[:100], "flagged": category == "integrity", "resolved": False,
    }
    conversation_logs.insert(0, log_entry)
    stats["conversations_today"] += 1
    return jsonify(response)

@app.route("/api/highlights")
def get_highlights():
    return jsonify({"paragraphs": ESSAY_PARAGRAPHS, "rubric_areas": RUBRIC_AREAS})

@app.route("/api/settings", methods=["GET"])
def get_settings():
    return jsonify(settings)

@app.route("/api/settings", methods=["PUT"])
def update_settings():
    data = request.get_json()
    if "feedback_types" in data: settings["feedback_types"].update(data["feedback_types"])
    if "guardrails" in data: settings["guardrails"].update(data["guardrails"])
    return jsonify(settings)

@app.route("/api/logs")
def get_logs():
    unresolved = sum(1 for l in conversation_logs if l["flagged"] and not l["resolved"])
    return jsonify({"logs": conversation_logs[:20], "stats": {**stats, "integrity_flags": unresolved}})

@app.route("/api/logs/<log_id>/resolve", methods=["POST"])
def resolve_log(log_id):
    for log in conversation_logs:
        if log["id"] == log_id:
            log["resolved"] = True
            return jsonify(log)
    return jsonify({"error": "Not found"}), 404

@app.route("/api/rubric")
def get_rubric():
    return jsonify({"areas": RUBRIC_AREAS})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    mode = "LIVE (Claude API)" if os.environ.get("ANTHROPIC_API_KEY") else "DEMO (simulated)"
    print(f"\n  🔵 FeedbackAI API → http://localhost:{port}\n  📡 Mode: {mode}\n")
    app.run(host="0.0.0.0", port=port, debug=os.environ.get("FLASK_ENV") == "development")
