# Concept Studio

## Product Role

Concept Studio is a design-strategy dialogue inside Thinking Machine. It helps a designer sharpen, compare, and converge concept territories while preserving the reasoning as a node graph.

It is intentionally not a generic chatbot and not a one-click concept generator. The designer controls the decision; the agent makes alternatives, rationale, trade-offs, and unknowns visible.

## Reference Video Findings

The supplied reference video demonstrates a useful progressive dialogue:

1. A designer provides a design-language brief.
2. The agent proposes named territories.
3. The designer rejects generic or style-led options.
4. The agent reframes the territories around stronger brand intent.
5. The designer compares, merges, renames, and sharpens formal DNA.
6. The agent produces principles, experiential cues, trade-offs, and a progression path.

The strong part is continuity. Each turn develops the previous vocabulary instead of restarting.

The weak part is output persistence. Long prose hides earlier alternatives, rejected assumptions, and the reason a direction changed. Concept Studio solves this by turning every useful response into a candidate graph branch.

## Interaction Model

```text
Design intent or selected canvas node
                 |
                 v
        Three distinct territories
                 |
                 v
     Develop / Compare / Merge / Stress-test
                 |
                 v
        Structured canvas draft preview
                 |
                 v
         Add / Keep Private / Discard
```

The right panel is the working surface. The canvas is durable reasoning memory.

## Response Contract

Every agent response returns:

- reasoning stage: `frame`, `explore`, `refine`, `compare`, or `converge`
- a concise response summary
- one to four concept directions
- up to two recommendations
- one high-leverage question
- two to four distinct quick actions
- live web research sources when current external evidence is relevant

Concept Studio runs a bounded web research step before structured concept generation. The research step prefers current, diverse, authoritative sources and passes the resulting evidence into the existing JSON contract. Source links remain visible in the dialogue, while search failure falls back to the existing grounded canvas workflow instead of blocking concept work.

Each direction contains:

- name
- design promise
- rationale
- principles
- experience cues
- honest trade-off
- evidence needed before commitment

This contract prevents the UI from collapsing back into an undifferentiated AI paragraph.

## Canvas Mapping

Each response creates a draft graph:

- `Goal`: the designer's current intent
- `Option`: one node for each concept territory
- `OpenQuestion`: the highest-leverage uncertainty
- `proposes`: Goal to Option
- `depends_on`: Option to OpenQuestion
- `refines`: selected existing node to the new Goal, when an anchor exists

Draft nodes are non-selectable, non-draggable, and visually muted. They are not added to project state until the designer chooses `Add` or `Keep Private`.

The incoming cluster uses collision-aware placement. Existing node coordinates remain user-owned and are never recalculated.

## Design Safeguards

### Prevent premature fixation

- Exploration requests three materially different territories.
- Comparison must use explicit criteria and trade-offs.
- Merge requests must identify the dominant parent and deliberate exclusions.
- Convergence keeps at least one alternative visible.

### Prevent fabricated authority

- The agent must not invent brand history, research findings, user evidence, or factual references.
- Missing evidence is represented as an evidence need, not presented as a fact.
- Recommendations remain candidates until the designer applies them.

### Keep information scannable

- Direction promise appears first.
- Detailed principles and cues use progressive disclosure.
- Trade-offs and evidence gaps are visually separate.
- The candidate confirmation card summarizes structure instead of repeating every node body.

## Related Product Patterns

- [Microsoft Copilot Pages](https://techcommunity.microsoft.com/blog/microsoft365copilotblog/announcing-copilot-pages-for-multiplayer-collaboration/4242701): moves ephemeral AI chat into a durable, editable collaboration surface.
- [Miro Sidekicks](https://help.miro.com/hc/en-us/articles/29902701849618-Sidekicks-overview): treats the visible canvas as context for an AI thought partner.
- [Miro AI with sticky notes](https://help.miro.com/hc/en-us/articles/28781881506834-Miro-AI-with-Sticky-notes): generates and transforms structured objects directly on a canvas.
- [FigJam AI sort and summarize](https://help.figma.com/hc/en-us/articles/18711926790423-Sort-and-summarize-stickies-with-FigJam-AI): keeps AI organization inside a larger human-led process and supports manual correction.
- [Google PAIR: Feedback and Control](https://pair.withgoogle.com/guidebook-v2/chapter/feedback-controls/): frames AI UX as a balance between automation and meaningful human control.
- [Figma Make](https://www.figma.com/blog/introducing-figma-make/): supports iterative exploration while preserving designer intention and craft.

## Research Signals

- [The Effects of Generative AI on Design Fixation and Divergent Thinking](https://arxiv.org/abs/2403.11164) is relevant to the requirement for visibly distinct alternatives and explicit fixation safeguards.
- [Modeling Sequential Design Actions as Designer Externalization on an Infinite Canvas](https://arxiv.org/abs/2603.11569) supports treating design work as a generate-and-curate sequence rather than a single text response.

These research links inform product hypotheses. They do not replace user testing of the implemented workflow.

## Adaptive Convergence

Suggestion chat gradually switches from exploration to conclusion once both conditions are met: at least five explicit user turns and a sufficiently structured committed or candidate graph. Structure is detected from node count, category diversity, and graph relations.

- Turn 5: consolidate repetition into 2–3 viable directions and clarify decision criteria.
- Turns 6–7: rank the remaining directions and recommend one provisional priority.
- Turn 8 and later: state a conclusion, accepted trade-off, and concrete next action; automatic graph extraction prioritizes a `Decision` node and limits the result to 1–2 nodes.

The adaptive convergence instruction overrides a divergent stage only for the current conversation response. The workspace stage itself is not silently changed.

## Current Boundaries

- Concept Studio uses the existing OpenAI provider abstraction and model profile control.
- It does not automatically commit, merge, or delete existing reasoning.
- It does not yet persist the dialogue as a team-visible audit log.
- Formal multi-model add-ons and MCP tool discovery remain future work.
