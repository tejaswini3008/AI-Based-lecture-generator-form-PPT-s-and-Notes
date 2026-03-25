from models.llm import generate_llm_response_stream


def generate_lecture_stream(content, subject, level):
    """Generate lecture with streaming response"""
    # 🔥 LIMIT INPUT SIZE (major speed improvement)
    content = content[:2500]  # Increased for more context

    prompt = f"""You are an expert {subject} professor for {level} level students.

Create a comprehensive, detailed lecture from this material:

{content}

Structure the lecture as follows:
1. Introduction: Overview of the topic and learning objectives
2. Core Concepts: Explain 4-6 key ideas in detail with examples
3. Detailed Explanations: Provide in-depth explanations for each concept
4. Practical Applications: Real-world examples and use cases
5. Summary: Key takeaways and conclusion
6. Additional Insights: Any related concepts or advanced topics

Make the lecture engaging, accurate, and suitable for {level} students. Use clear language and ensure completeness. Generate a full lecture content, not just bullet points.
"""

    return generate_llm_response_stream(prompt, use_fast_model=True, extra_options={"num_predict": 400})  # Increased for longer output


def generate_qa_stream(content, subject, level, question):
    """Generate answer to student question based on extracted content or general knowledge"""
    content = content[:1400]

    prompt = f"""You are an expert {subject} professor for {level} level students.

The following content is from the lecture material (use it if relevant):
{content}

Student question:
{question}

Answer clearly and directly. If the question relates to the provided content, use it. Otherwise, answer based on your general knowledge as an expert professor. Keep the answer concise (50-100 words).
"""

    return generate_llm_response_stream(prompt, use_fast_model=True, extra_options={"num_predict": 160})


def generate_summary_stream(content, subject, level):
    """Generate summary with streaming response"""
    content = content[:1800]

    prompt = f"""You are an expert {subject} professor for {level} level students.

Create a concise summary from this material:

{content}

Format:
1. Key Topics Covered
2. Main Concepts
3. Important Points
4. Conclusion

Keep output short (200 words max) and clear."""

    return generate_llm_response_stream(prompt, use_fast_model=True, extra_options={"num_predict": 180})


def generate_quiz_stream(content, subject, level):
    """Generate quiz questions with streaming response"""
    content = content[:1800]

    prompt = f"""You are an expert {subject} professor for {level} level students.

Create concise quiz questions from this material:

{content}

Generate 6 quick multiple-choice questions with 4 options (A-D), include only the correct answer line.

Format:
1. Question text
   A) Option 1
   B) Option 2
   C) Option 3
   D) Option 4
   Correct: A

Keep it short and fast."""

    return generate_llm_response_stream(prompt, use_fast_model=True, extra_options={"num_predict": 170})
