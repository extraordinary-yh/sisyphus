# Rank and scoring

| Tier | Divisions | Stars per division | Total score at entry |
| --- | ---: | ---: | ---: |
| 废铁 | 3 | 3 | 0 |
| 青铜 | 3 | 3 | 9 |
| 白银 | 3 | 3 | 18 |
| 黄金 | 4 | 4 | 27 |
| 铂金 | 4 | 4 | 43 |
| 钻石 | 5 | 5 | 59 |
| 星耀 | 5 | 5 | 84 |
| 王者 | unlimited | unlimited | 109 |

Study: one star per block below Diamond; one per two blocks from Diamond onward, determined by the rank at the start of the day. Odd blocks do not carry over. Each qualifying hobby awards one star per day. The default qualifying duration, including exercise, is 30 minutes.

Gradient entertainment penalties: ≤1h 0; >1h −1; >2h −2; >3h −4; >4h −8; >5h −16; >6h −32, capped at 32. Exact 2h remains −1; one second later becomes −2. Video and manually entered games share this total.

Sleep: ≤00:30 +1; 00:31–00:59 0; 01:00–01:59 −1; 02:00–02:59 −2; 03:00–03:59 −4; 04:00–04:59 −8; 05:00 onward −16. Evening times belong to the selected day, post-midnight times to the following morning. The linear original rule is also available in settings.

All planned blocks completed and ≤60 minutes entertainment earns a perfect day. A nonempty plan and confirmed usage are required. Streak milestones at 3/7/14/30 qualifying days award +1/+2/+3/+5, repeating in 30-day cycles. Every seven qualifying streak days earns one shield (inventory cap one). Shields require explicit use, preserve the protected streak without incrementing it, and never prevent star penalties. Strict streaks still reset. Missing calendar days reset both streak counts.

The floor is 废铁 III 0 stars. Every deduction is recorded and animated even at the floor; no negative debt is created. Raw net stars and actual rank change are shown separately.

A day can carry an explicitly requested `rewardOnlyReason` exception. That day's video and late-sleep deductions are waived, while the original evidence stays intact. Missing usage confirmation and bedtime remain unknown and do not prevent this special settlement. The exception is shown in the lobby, history and replay, never propagates to another day, and does not waive the normal perfect-day requirements. It is absent by default.

Completed session records can preserve a separate `studySession` source (session ID, study date and original plan date) alongside the chosen settlement date. Unknown block minutes remain `null`; estimated durations use `minutesRange` without inventing a precise duration. Neither changes the block-based reward.

See [`lib/game.ts`](../lib/game.ts) for the authoritative implementation and [`tests/game.test.mjs`](../tests/game.test.mjs) for boundary cases.
