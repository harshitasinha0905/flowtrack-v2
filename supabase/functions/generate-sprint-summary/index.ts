import "@supabase/functions-js/edge-runtime.d.ts";

import { withSupabase } from "@supabase/server";

console.log("Sprint summary function started");

export default {
  fetch: withSupabase(
    { auth: ["publishable", "secret"] },
    async function (req, ctx) {
      try {
        const { sprintData } = await req.json();

        if (!sprintData) {
          return Response.json(
            { error: "Sprint data is required" },
            { status: 400 },
          );
        }

        const apiKey = Deno.env.get("GEMINI_API_KEY");

        if (!apiKey) {
          return Response.json(
            { error: "Gemini API key is not configured" },
            { status: 500 },
          );
        }

        const prompt = `You are an experienced project manager reviewing a sprint.

        Analyze the provided sprint data carefully and create a factual, useful sprint summary.

        ACTUAL SPRINT DATA:
        ${JSON.stringify(sprintData, null, 2)}

        Your analysis must be based ONLY on the provided sprint data.

        You must specifically analyze:

        1. Completed work
          - Identify the actual completed tasks by their titles.
          - Mention meaningful completed work rather than simply saying that tasks were completed.

        2. Work currently in progress
          - Identify important tasks that are currently in progress.
          - Pay particular attention to high and urgent priority tasks.

        3. Tasks needing attention
          - Identify specific tasks that need attention.
          - Mention the task title and explain why it needs attention.
          - Consider overdue tasks, urgent/high-priority tasks, tasks stuck in review, and tasks with upcoming due dates.

        4. Risks
          - Identify realistic risks based only on the provided data.
          - Do not invent blockers, dependencies, customer issues, or technical problems that are not present in the data.
          - If there is no clear risk, say so rather than inventing one.

        5. Next actions
          - Give practical actions based on the actual tasks.
          - Prioritize urgent or overdue work when appropriate.

        IMPORTANT RULES:
        - Never invent task names, people, deadlines, blockers, or project information.
        - Use the exact task titles from the data when referring to tasks.
        - Do not make assumptions about why a task is delayed unless the data explicitly shows it.
        - A task marked "done" is completed.
        - A task marked "in_progress" is currently being worked on.
        - A task marked "review" is awaiting review.
        - A task marked "todo" has not started.
        - A task with "isOverdue": true is overdue.
        - Pay attention to priority: urgent > high > medium > low.
        - Do not claim that a task is overdue unless "isOverdue" is true.
        - Do not claim that the sprint is at risk simply because some tasks are incomplete.
        - Base the overall status on the balance of completed, active, review, todo, overdue, and priority tasks.

        Return ONLY valid JSON in exactly this structure:

        {
          "overallStatus": "A concise assessment of the sprint",
          "goingWell": [
            "Specific completed or positive item",
            "Specific completed or positive item"
          ],
          "needsAttention": [
            "Specific task that needs attention and why",
            "Specific task that needs attention and why"
          ],
          "risks": [
            "Specific risk supported by the data"
          ],
          "nextActions": [
            "Specific practical action",
            "Specific practical action"
          ]
        }

        Additional output rules:
        - goingWell: 1-5 items.
        - needsAttention: 1-5 items.
        - risks: 1-4 items.
        - nextActions: 1-3 items.
        - Keep each item concise but informative.
        - Mention task titles when discussing specific tasks.
        - Do not use Markdown.
        - Do not wrap the JSON in a code block.
        - Do not include any text outside the JSON.`;

        console.log("Sprint data received:", sprintData);
        console.log("Sending sprint analysis request to Gemini");

        const response = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": apiKey,
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: prompt,
                    },
                  ],
                },
              ],
              generationConfig: {
                responseMimeType: "application/json",
              },
            }),
          },
        );

        if (!response.ok) {
          const errorText = await response.text();

          console.error("Gemini API error:", errorText);

          return Response.json(
            {
              error: "Gemini API request failed",
              details: errorText,
            },
            { status: response.status },
          );
        }

        const result = await response.json();

        const responseText =
          result.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

        if (!responseText) {
          throw new Error("Gemini returned an empty response");
        }

        const summary = JSON.parse(responseText);

        return Response.json(summary);
      } catch (error) {
        console.error("Sprint summary error:", error);

        return Response.json(
          { error: "Failed to generate sprint summary" },
          { status: 500 },
        );
      }
    },
  ),
};