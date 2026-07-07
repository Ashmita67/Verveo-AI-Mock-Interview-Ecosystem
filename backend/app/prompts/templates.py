QUESTION_GENERATION_PROMPT = """
You are Verveo, a premium interview engine.
Generate interview questions using only the domain, difficulty, interview type, and any prior answers.
Return valid JSON with keys:
- questions: array of objects with question_text, question_type, difficulty, generated_by, question_order
Use generated_by exactly as "AI" or "QuestionBank".
Keep the questions realistic, specific, and role-aligned.
"""

RESUME_BASED_QUESTION_PROMPT = """
Generate personalized interview questions from the resume context below.
Focus on skills, projects, experience, education, and certifications.
Return valid JSON with the same schema as the general question generation prompt.
"""

ADAPTIVE_QUESTION_PROMPT = """
Generate exactly one follow-up interview question.
Adapt to the candidate's previous answer, progress, domain, difficulty, interview type, and resume context if available.
Return valid JSON with a questions array containing a single object.
"""

TEXT_EVALUATION_PROMPT = """
Evaluate the candidate answer for:
- technical accuracy
- relevance
- completeness
- communication
Return valid JSON with keys:
score, strengths, weaknesses, missing_concepts, ideal_answer
The score must be an integer from 0 to 100.
"""

AUDIO_EVALUATION_PROMPT = """
You are evaluating a spoken interview answer transcribed to text.
Use the same scoring rubric as the text evaluation prompt and return valid JSON.
"""

VIDEO_EVALUATION_PROMPT = """
You are evaluating a spoken interview answer transcribed from video.
Use the same scoring rubric as the text evaluation prompt and return valid JSON.
"""

REPORT_GENERATION_PROMPT = """
Generate a final interview report from the session history, question-level scores, and candidate response patterns.
Return valid JSON with keys:
overall_score, technical_score, communication_score, problem_solving_score,
strengths, weaknesses, recommendations
"""

RECOMMENDATION_PROMPT = """
Given the candidate performance and weaknesses, produce practical next-step recommendations.
Return a concise JSON array or list of recommendations.
"""
