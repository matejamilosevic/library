# Tests

- Work item: LIB-10 (e11ec8a2-32dd-411f-a3a9-626f382eaaa1)
- Category: tests
- Version: 96b5e25b-0918-4e5b-b9c2-cd89aa2cd126
- Approval status: approved
- Approved at: 2026-10-05T13:32:57.702Z
- Approved by: Mateja Milosevic (a60f8343-5bb4-43b1-b676-35b91cf79f72)
- Evaluation time: 2026-10-06T11:09:11.621Z
- Source: https://staging.codemerlin.ai/work-items/e11ec8a2-32dd-411f-a3a9-626f382eaaa1?tab=tests

```json
[
  {
    "order": 1,
    "steps": [
      "Given the library desk service is initialized with standard seeded catalog data",
      "When a visitor sends an HTTP GET request to '/'",
      "Then the response status is 200 with header 'content-type' equal to 'text/html; charset=utf-8'",
      "And the response body contains an '<h1>' element with text 'Library desk'",
      "And immediately following the heading, the '<p class=\"lede\">' paragraph displays 'Sign in to borrow a book, return it, or join the waitlist.'",
      "And the previous text 'Sign in to borrow, return, and wait for a copy.' is not present anywhere in the document"
    ],
    "title": "Desk welcome line displays updated text directly under the Library desk heading",
    "repo_keys": [
      "matejamilosevic/library"
    ],
    "ac_anchors": [
      "AC-001"
    ],
    "fr_anchors": [
      "FR-001",
      "SC-001"
    ],
    "harness_class": "in_repo",
    "home_repo_key": "matejamilosevic/library",
    "test_data_ref": "desk_html_fixture",
    "validation_type": "unit",
    "scenario_category": "happy"
  },
  {
    "order": 2,
    "steps": [
      "Given the rendered library desk HTML document from 'GET /'",
      "When inspecting the header container and responsive style definitions",
      "Then the heading text remains strictly 'Library desk'",
      "And the welcome sentence 'Sign in to borrow a book, return it, or join the waitlist.' is contained within the standard '<p class=\"lede\">' tag without viewport-conditional text substitution",
      "And existing sign-in and account creation forms remain intact with headers 'Sign in' and 'Create an account'",
      "And no other page copy, buttons, or form controls on the desk page are modified"
    ],
    "title": "Desk layout preserves heading and responsive presentation without altering other copy",
    "repo_keys": [
      "matejamilosevic/library"
    ],
    "ac_anchors": [
      "AC-001"
    ],
    "fr_anchors": [
      "FR-001",
      "SC-001"
    ],
    "harness_class": "in_repo",
    "home_repo_key": "matejamilosevic/library",
    "test_data_ref": "desk_html_fixture",
    "validation_type": "unit",
    "scenario_category": "edge"
  }
]
```
