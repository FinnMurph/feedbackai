"""
FeedbackAI — Chat Engine
Handles Claude API calls with system prompt engineering.
Falls back to curated demo responses when no API key is available.
"""

import os, random

SYSTEM_PROMPT = """You are a formative feedback assistant for university students working on writing assignments. Your role is to help students improve their writing through Socratic questioning.

RULES (strictly enforced):
1. NEVER write complete sentences, paragraphs, or content for the student.
2. Use the Socratic method: ask clarifying questions that guide the student to discover improvements themselves.
3. Tag every response with the most relevant rubric criterion: Organization, Clarity, Evidence, or Critical Thinking.
4. If a student asks you to write content, generate an answer, or do their work, politely decline and redirect with a guiding question. Flag the interaction.
5. Keep responses concise (2-4 sentences) and actionable.
6. Reference the assignment rubric criteria in your feedback.

FORMAT your response as plain text. Start with your feedback/question, then on a new line write: [RUBRIC: CriterionName]
If the student asked you to write content for them, add: [FLAGGED: integrity]"""


def classify_message(msg):
    """Classify a user message into a feedback category."""
    l = msg.lower()
    integrity_phrases = ["write this", "write my", "give me the answer", "do my homework",
        "write a paragraph", "just write", "do it for me", "finish this", "complete this for me"]
    if any(p in l for p in integrity_phrases):
        return "integrity"
    if any(w in l for w in ["structure", "organization", "flow", "outline", "order", "transition"]):
        return "organization"
    if any(w in l for w in ["clarity", "clear", "confusing", "readable", "concise", "thesis", "jargon"]):
        return "clarity"
    if any(w in l for w in ["source", "citation", "evidence", "reference", "data", "research"]):
        return "evidence"
    if any(w in l for w in ["thinking", "argument", "counter", "depth", "analysis", "skeptic"]):
        return "critical"
    return "default"


def get_chat_response(message, history, settings):
    """Get a response from Claude API or demo fallback."""
    api_key = os.environ.get("ANTHROPIC_API_KEY")

    if api_key:
        return _call_claude(message, history, api_key)
    else:
        return _demo_response(message)


def _call_claude(message, history, api_key):
    """Make a real API call to Claude."""
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=api_key)

        # Build message history
        messages = []
        for msg in history[-10:]:  # Last 10 messages for context
            messages.append({"role": msg["role"], "content": msg["text"]})
        messages.append({"role": "user", "content": message})

        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=300,
            system=SYSTEM_PROMPT,
            messages=messages,
        )

        text = response.content[0].text
        rubric = None
        flagged = False

        # Parse rubric tag
        for area in ["Organization", "Clarity", "Evidence", "Critical Thinking"]:
            if f"[RUBRIC: {area}]" in text:
                rubric = area
                text = text.replace(f"[RUBRIC: {area}]", "").strip()
                break

        # Parse flag
        if "[FLAGGED: integrity]" in text:
            flagged = True
            text = text.replace("[FLAGGED: integrity]", "").strip()

        return {"text": text, "rubric": rubric, "flagged": flagged}

    except Exception as e:
        print(f"Claude API error: {e}")
        return _demo_response(message)


# ── Demo Mode Responses ──────────────────────────────────────────────

DEMO_RESPONSES = {
    "organization": [
        {"text": "Your introduction establishes the topic well. But what are the 2-3 key arguments you plan to make? A roadmap sentence previewing those points would give the reader a clear path.", "rubric": "Organization"},
        {"text": "Let's examine your structure. Try reading just the first sentence of each paragraph — do they tell a coherent story on their own? That's a quick way to test whether your flow works.", "rubric": "Organization"},
        {"text": "I notice the transition between your second and third paragraphs feels abrupt. What linking idea connects them? Making that bridge explicit would strengthen the overall structure.", "rubric": "Organization"},
    ],
    "clarity": [
        {"text": "This passage packs several ideas into one sentence. What is the single most important claim? Try expressing it in one short, direct sentence first, then layer in supporting details.", "rubric": "Clarity"},
        {"text": "You use some abstract language like 'uncertain problem spaces.' Could you make that more concrete? What specific uncertainties are you referring to? Concrete language helps readers grasp your argument.", "rubric": "Clarity"},
        {"text": "The phrase 'critical adoption drivers' is doing a lot of work. Can you unpack it — what exactly needs to happen for instructors to adopt this tool?", "rubric": "Clarity"},
    ],
    "evidence": [
        {"text": "You reference Cagan (2018) effectively, but what other sources could strengthen your claims? What type of evidence — surveys, case studies, institutional data — would be most persuasive here?", "rubric": "Evidence"},
        {"text": "Your evidence strategy relies heavily on one source. If a reader questioned Cagan's framework, would your argument still hold? Having 2-3 supporting references creates resilience.", "rubric": "Evidence"},
        {"text": "You mention market research from Part 1 — can you be more specific about the findings? Quantifying claims with percentages or sample sizes adds significant credibility.", "rubric": "Evidence"},
    ],
    "critical": [
        {"text": "You've identified trust as a critical adoption driver — that's a strong insight. But what might a skeptic say? Perhaps that AI feedback can never replicate human mentorship? Engaging with counterarguments strengthens your analysis.", "rubric": "Critical Thinking"},
        {"text": "Your analysis focuses on benefits of limiting to formative feedback. But what are the risks of this constraint? Could students feel the tool is too limited? Acknowledging tensions shows depth.", "rubric": "Critical Thinking"},
        {"text": "You make a strong case for the MVP scope. But why is formative feedback the right starting point rather than, say, rubric explanation or citation checking? What evidence supports this prioritization?", "rubric": "Critical Thinking"},
    ],
    "integrity": [
        {"text": "I can't write content for you — that wouldn't support your learning. But I can help you get unstuck. What's the main point you're trying to make in this section? Let's work through it together.", "rubric": None, "flagged": True},
        {"text": "My role is to guide your thinking, not produce your work. Tell me what argument you want to make here, and I'll help you evaluate whether your current draft achieves that goal.", "rubric": None, "flagged": True},
        {"text": "That's something I need to stay away from — I'm here as a feedback guide, not a content generator. What part of this section feels hardest right now? Let's break it down.", "rubric": None, "flagged": True},
    ],
    "default": [
        {"text": "Before I guide you, tell me: what do you think is the strongest part of your draft, and what feels least developed? That helps me focus feedback where it'll have the most impact.", "rubric": None},
        {"text": "Good instinct to ask for help! If you had to grade this section against the rubric right now, which criterion would score lowest? That's often the best place to focus.", "rubric": None},
        {"text": "Interesting question. Can you point me to the specific paragraph or sentence you're working on? The more targeted our conversation, the more useful my feedback will be.", "rubric": None},
    ],
}

_counters = {}

def _demo_response(message):
    """Return a varied demo response based on message classification."""
    category = classify_message(message)
    bank = DEMO_RESPONSES.get(category, DEMO_RESPONSES["default"])
    idx = _counters.get(category, 0) % len(bank)
    _counters[category] = idx + 1
    resp = {**bank[idx]}
    resp.setdefault("flagged", False)
    return resp
