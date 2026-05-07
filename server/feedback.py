"""
FeedbackAI — Feedback Engine
Essay content, rubric definitions, and highlight data.
"""

RUBRIC_AREAS = [
    {"key": "Organization", "color": "#3b82f6", "icon": "layout", "weight": 25,
     "description": "Logical flow and structure. Clear transitions between ideas, coherent paragraph organization, and a roadmap that guides the reader."},
    {"key": "Clarity", "color": "#8b5cf6", "icon": "type", "weight": 25,
     "description": "Clear thesis statement, concise language, and readable prose. Ideas are expressed directly without unnecessary jargon or ambiguity."},
    {"key": "Evidence", "color": "#059669", "icon": "book-open", "weight": 25,
     "description": "Credible sources, proper APA citations, and data that supports claims. Arguments are grounded in research, not just opinion."},
    {"key": "Critical Thinking", "color": "#d97706", "icon": "lightbulb", "weight": 25,
     "description": "Original analysis and depth of argument. Counterpoints are addressed, assumptions are questioned, and connections are drawn."},
]

ESSAY_PARAGRAPHS = [
    {
        "id": 1,
        "text": "The roadmap for the AI Assignment Feedback Assistant prioritizes discovery and validation before feature expansion. This reflects best practices for product development in uncertain problem spaces. As Cagan (2018) emphasizes, strong products emerge from deep understanding of customer needs rather than prematurely committing to solutions.",
        "highlights": [
            {"start": 0, "end": 88, "rubric": "Organization",
             "note": "Strong opening — consider adding a roadmap sentence previewing your key arguments."},
        ],
    },
    {
        "id": 2,
        "text": "Phase 1 focuses on validating the core problem: instructors' limited capacity to provide timely, formative feedback. Market research from Part 1 indicated educator concern around AI misuse, making trust and transparency critical adoption drivers.",
        "highlights": [
            {"start": 131, "end": 248, "rubric": "Evidence",
             "note": "You reference market research — can you cite specific data points to quantify instructor workload?"},
        ],
    },
    {
        "id": 3,
        "text": "The MVP phase deliberately limits functionality to formative feedback rather than grading or answer generation. By centering rubric-aligned suggestions and instructor oversight, the roadmap aligns with ethical AI use while addressing real workflow pain points.",
        "highlights": [
            {"start": 0, "end": 97, "rubric": "Critical Thinking",
             "note": "Good constraint scoping. What counterarguments might skeptics raise about limiting to formative feedback?"},
        ],
    },
    {
        "id": 4,
        "text": "Broad, milestone-based timelines are used instead of fixed delivery dates to preserve agility and learning, consistent with modern roadmapping guidance (Lombardo et al., 2017). Stakeholder involvement increases across phases, expanding from users in discovery to institutional decision-makers during scaling.",
        "highlights": [],
    },
]
