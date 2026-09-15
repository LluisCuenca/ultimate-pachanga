# Mobile motion and compact navigation

The mobile header now opens a six-destination menu with a visible current page,
keyboard focus containment, Escape dismissal and focus restoration. The bottom
navigation and its reserved padding are removed. Existing routes, the desktop
sidebar, profile administration links and sign-out remain available.

Player detail cards no longer reserve a second nickname line. Market value has
more prominence. History and match results now use one row with A/D/T/F/G/B/V
and the final score. B and V retain their real values; the final score opens the
breakdown and awards. The history row still links to its real match, with a
separate accessible score button. Match score editing remains in the player cell.

Motion uses shared press/surface/feature timings, cancellable pointer feedback,
once-per-route visible reveals, a one-pass gold reflection, staged ideal-seven
cards, actual placement/reordering transitions, score-update emphasis, photo
expansion, image fades, quieter skeletons and mobile form sheets. Successful
lineup saves receive inline confirmation; rollback and save locking are preserved.
Player-card navigation uses progressive view transitions where supported.
Reduced-motion CSS and JavaScript safeguards retain immediate, readable content.
No extra motion library, video downloads or fictional counters were introduced.
The former proposal to animate the bottom navigation is superseded by the menu.
Optional welcome video and repeated celebrations remain deferred as proposed.

Validation: 590 tests in 41 files passed, including menu navigation/Escape/focus,
single-row scoring, pointer cancellation, movement cleanup and reduced-motion
behavior. Build, lint, formatting and whitespace checks passed locally.

Rendered mobile/desktop verification remains pending: browser access was denied
by the environment policy. No alternative browser runtime was used to bypass it.
The photo/card transitions, grid density at 390px and sheet positioning must still
be assessed in the real browser; automated tests do not establish visual quality.
