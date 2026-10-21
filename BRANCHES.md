# Unmerged task: upgrade price display

- Reference: HOME-PROJECT-IDEAS-20261021 / idea021 / IGR-20261021-INVESTIGATE-01
- Agent: Codex; 2026-10-21. Status: checked with caveat; coordinator review pending.
- Branch: task/idle-grow-upgrade-price-20261021. Base/target: master,
  a9ac9556365a6ee79f63fbc2f842cd60e7b34e97 (genuine two-commit clone).
- Version impact: none; no release, merge or deployment.

## Investigation and pre-edit evidence

This is a small static 2020 clicker prototype, not a modern framework app.
index.html calls Init, Click and buyClickUpgrade from js/script.js. Players
click Grow Wheat and buy four upgrades. There is no persistence, dependency
manifest, test runner configuration, build system, CI or repository instruction
file. perSecond is initialized to zero with no existing way to increase it;
no timer change is proposed. README contains only the project heading.

Read-only sibling IdleGrow at 540c712882c9ab0cec3b9ab897a470cc535da0fd
has the same title, function bodies and initial Hoe. Idle-Grow adds three
upgrade instances/buttons and changes styles. Histories are separate (sibling
one commit, this repository two); source strongly indicates related versions,
but there is no documentation proving intent or canonical succession.
No sibling changes or history imports were made.

Cloud-visible refs showed only master in each repository, and connector open-PR
searches returned none. Idle-Grow's all-state issues collection was empty.
Unpublished ownership and local T3 history cannot be independently inspected.

Before production edits, a Node VM probe executed the actual master script:
ten Click calls then a Hoe purchase yielded funds=0, perClick=2, price=12,
while index.html still advertised Price: 10. An unaffordable retry preserved
funds/power/price and issued one alert. The button's existing Price label and
the purchase function's price comparison/multiplier establish the contract:
show the price required for the next purchase. This avoids misleading players
about the next cost without changing game balance or purchase arithmetic.

Bounded acceptance: update each purchased button's displayed price to the
new internal price; charge that amount on its next purchase; preserve rejected
purchases, ordinary clicks and other upgrade prices. Files: index.html,
js/script.js, tests/upgrade-price.test.cjs and this log.

## Change and checks

Each existing purchase handler passes its button. Only its price span is
updated after the existing price multiplication. Raw numeric text preserves
the exact internal price, including fractional costs; rounding/formatting
policy and the existing mislabeled Crook/Scythe names are outside this fix.

Cloud Node v24.19.0; no installs, servers, providers or browser used.

- Baseline Node VM probe: reproduced 10 displayed versus 12 internal.
- node --test Idle-Grow/tests/upgrade-price.test.cjs before fix: exit 1,
  four price regressions failed, two controls passed. Tests execute production
  script and inline HTML handlers with synthetic DOM/timer/alert only.
- Same test command after fix: exit 0, six tests passed. Checks cover all four
  upgrade purchases and second charges, unaffordable rejection and click flow.
- node --check Idle-Grow/js/script.js: exit 0.
- node --check Idle-Grow/tests/upgrade-price.test.cjs: exit 0.
- git diff --check reported preserved CRLF line endings as trailing whitespace.
  No line-ending normalization was made; CR-aware check is recorded separately.
- Initial get_repo calls with guessed repo/repo_full_name parameters returned
  InvalidActionArgumentsError. Metadata succeeded through github_fetch; this
  was a connector argument error, not a source failure.
- A read-only git diff --no-index comparing sibling scripts returned exit 1
  because the three additional upgrade instances differ, as expected.

Limits: no real browser/layout/accessibility verification, no full DOM parser,
no existing build/lint/type/test commands to run. Fake DOM validates wiring
and text updates only. No live Pages/deployment check. Existing numerical
precision, raw price length and other prototype limitations remain outside
scope. Empty remote check lists must not be described as CI green.
