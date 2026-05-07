"""
FeedbackAI — Chat Engine
Handles Claude API calls with system prompt engineering.
Falls back to curated demo responses when no API key is available.
"""

import os, json, time

BASE_SYSTEM_PROMPT = """You are a formative feedback assistant for university students working on writing assignments. Your role is to help students improve their writing through Socratic questioning.

RULES (strictly enforced):
{rules}

FORMAT your response as plain text. Start with your feedback/question, then on a new line write: [RUBRIC: CriterionName]
If the student asked you to write content for them, add: [FLAGGED: integrity]"""

BASE_RULES = [
    "NEVER write complete sentences, paragraphs, or content for the student.",
    "Use the Socratic method: ask clarifying questions that guide the student to discover improvements themselves.",
    "Tag every response with the most relevant rubric criterion{criteria_note}.",
    "If a student asks you to write content, generate an answer, or do their work, politely decline and redirect with a guiding question. Flag the interaction.",
    "Keep responses concise (2-4 sentences) and actionable.",
    "Reference the assignment rubric criteria in your feedback.",
]

OPEN_RULES = [
    "Use the Socratic method: ask clarifying questions that guide the student to discover improvements themselves.",
    "Tag every response with the most relevant rubric criterion{criteria_note}.",
    "Keep responses concise (2-4 sentences) and actionable.",
    "Reference the assignment rubric criteria in your feedback.",
]


def _build_system_prompt(settings):
    """Build a system prompt that reflects current settings."""
    guardrails = settings.get("guardrails", {})
    feedback_types = settings.get("feedback_types", {})

    key_map = {"organization": "Organization", "clarity": "Clarity",
               "evidence": "Evidence", "critical_thinking": "Critical Thinking"}
    active = [v for k, v in key_map.items() if feedback_types.get(k, True)]
    disabled = [v for k, v in key_map.items() if not feedback_types.get(k, True)]

    criteria_note = f" ({', '.join(active)})" if active else ""
    disabled_note = f" Do NOT give feedback on: {', '.join(disabled)}." if disabled else ""

    block_answers = guardrails.get("block_answers", True)
    rule_set = BASE_RULES if block_answers else OPEN_RULES

    rules_text = "\n".join(
        f"{i+1}. {r.format(criteria_note=criteria_note)}"
        for i, r in enumerate(rule_set)
    )
    if disabled_note:
        rules_text += f"\n\nACTIVE CRITERIA NOTE:{disabled_note} Only tag with active criteria."

    return BASE_SYSTEM_PROMPT.format(rules=rules_text)


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
        return _call_claude(message, history, api_key, settings)
    else:
        return _demo_response(message, settings)


def stream_chat_response(message, history, settings):
    """Generator: yields SSE-formatted lines for streaming."""
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if api_key:
        yield from _stream_claude(message, history, api_key, settings)
    else:
        yield from _stream_demo(message, settings)


def _stream_claude(message, history, api_key, settings):
    """Stream tokens from Claude via SSE."""
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=api_key)

        messages = []
        for msg in history[-10:]:
            messages.append({"role": msg["role"], "content": msg["text"]})
        messages.append({"role": "user", "content": message})

        full_text = ""
        with client.messages.stream(
            model="claude-sonnet-4-6",
            max_tokens=300,
            system=_build_system_prompt(settings),
            messages=messages,
        ) as stream:
            for token in stream.text_stream:
                full_text += token
                yield f"data: {json.dumps({'token': token})}\n\n"

        # Parse tags from full assembled text
        rubric = None
        flagged = False
        clean = full_text
        for area in ["Organization", "Clarity", "Evidence", "Critical Thinking"]:
            tag = f"[RUBRIC: {area}]"
            if tag in clean:
                rubric = area
                clean = clean.replace(tag, "").strip()
                break
        if "[FLAGGED: integrity]" in clean:
            flagged = True
            clean = clean.replace("[FLAGGED: integrity]", "").strip()

        yield f"data: {json.dumps({'done': True, 'rubric': rubric, 'flagged': flagged, 'text': clean})}\n\n"

    except Exception as e:
        print(f"Claude streaming error: {e}")
        yield from _stream_demo(message, settings)


def _stream_demo(message, settings):
    """Simulate streaming for demo mode by yielding words with a small delay."""
    resp = _demo_response(message, settings)
    text = resp["text"]
    words = text.split(" ")
    for i, word in enumerate(words):
        token = word if i == len(words) - 1 else word + " "
        yield f"data: {json.dumps({'token': token})}\n\n"
        time.sleep(0.05)
    yield f"data: {json.dumps({'done': True, 'rubric': resp.get('rubric'), 'flagged': resp.get('flagged', False), 'text': text})}\n\n"


def _call_claude(message, history, api_key, settings):
    """Make a real API call to Claude."""
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=api_key)

        messages = []
        for msg in history[-10:]:
            messages.append({"role": msg["role"], "content": msg["text"]})
        messages.append({"role": "user", "content": message})

        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=300,
            system=_build_system_prompt(settings),
            messages=messages,
        )

        text = response.content[0].text
        rubric = None
        flagged = False

        for area in ["Organization", "Clarity", "Evidence", "Critical Thinking"]:
            if f"[RUBRIC: {area}]" in text:
                rubric = area
                text = text.replace(f"[RUBRIC: {area}]", "").strip()
                break

        if "[FLAGGED: integrity]" in text:
            flagged = True
            text = text.replace("[FLAGGED: integrity]", "").strip()

        return {"text": text, "rubric": rubric, "flagged": flagged}

    except Exception as e:
        print(f"Claude API error: {e}")
        return _demo_response(message, settings)


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

_CATEGORY_TO_TYPE = {
    "organization": "organization",
    "clarity": "clarity",
    "evidence": "evidence",
    "critical": "critical_thinking",
}

_counters = {}


def _demo_response(message, settings):
    """Return a varied demo response based on message classification and active settings."""
    feedback_types = settings.get("feedback_types", {})
    guardrails = settings.get("guardrails", {})

    category = classify_message(message)

    # Integrity: only block if guardrail is on
    if category == "integrity" and not guardrails.get("block_answers", True):
        category = "default"

    # If the feedback type for this category is disabled, fall back to default
    type_key = _CATEGORY_TO_TYPE.get(category)
    if type_key and not feedback_types.get(type_key, True):
        category = "default"

    bank = DEMO_RESPONSES.get(category, DEMO_RESPONSES["default"])
    idx = _counters.get(category, 0) % len(bank)
    _counters[category] = idx + 1
    resp = {**bank[idx]}
    resp.setdefault("flagged", False)
    return resp
