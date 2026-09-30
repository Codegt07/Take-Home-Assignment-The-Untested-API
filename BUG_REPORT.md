# Bug Report

## Overview

During the testing of the Task Manager API, two functional bugs were identified in the existing implementation. Both bugs were discovered through automated tests written for the service and route behavior.

The issues were related to:

1. Task status filtering
2. Task pagination

Both issues were reproduced with failing tests, investigated in the existing implementation, fixed, and then verified by running the complete test suite.

---

# Bug 1: Partial Status Matching

## Summary

The task status filter performs a partial string match instead of an exact status match.

## Location

`src/services/taskService.js`

## Expected Behavior

When a status is provided to `getByStatus()`, only tasks whose status exactly matches the requested status should be returned.

For example:

```text
Requested status: "todo"

Expected:

- todo        → included
- in_progress → excluded
- done        → excluded
```

Similarly, an invalid or partial value such as `"in"` should not match `"in_progress"`.

## Actual Behavior

The implementation used:

```js
const getByStatus = (status) => tasks.filter((t) => t.status.includes(status));
```

Because `includes()` performs a partial string match:

```text
"in_progress".includes("in")

→ true
```

a request for the status `"in"` incorrectly returned tasks whose status was `"in_progress"`.

## How It Was Discovered

A unit test was added specifically to verify that partial status values should not return matching tasks.

The test created an `in_progress` task and requested:

```js
taskService.getByStatus('in');
```

The expected result was an empty array.

The test initially failed with:

```text
Expected length: 0

Received length: 1
```

This confirmed that the service was accepting partial status matches.

## Root Cause

The filtering logic used `String.includes()` instead of comparing the task status directly with the requested status.

The issue was therefore in the filtering condition rather than in the route or test setup.

## Fix

The filtering condition was changed to use exact equality:

```js
const getByStatus = (status) =>
  tasks.filter((t) => t.status === status);
```

This ensures that only an exact status match is returned.

## Verification

After applying the fix, the previously failing unit test passed.

The route-level status filter test also passed, confirming that the corrected service behavior works through the HTTP API.

---

# Bug 2: Pagination Off-by-One Error

## Summary

The pagination logic calculated the starting offset incorrectly for 1-based page numbers.

## Location

`src/services/taskService.js`

## Expected Behavior

The API treats pages as 1-based.

For example, with four tasks and a limit of two:

```text
Page 1 → Task 1, Task 2

Page 2 → Task 3, Task 4
```

Therefore, page 1 should have an offset of `0`.

## Actual Behavior

The implementation calculated the offset using:

```js
const offset = page * limit;
```

For:

```text
page = 1
limit = 2
```

the calculated offset was:

```text
1 × 2 = 2
```

As a result, the first page started from the third task.

For example:

```text
Expected:

Page 1 → Task 1, Task 2

Actual:

Page 1 → Task 3, Task 4
```

## How It Was Discovered

A unit test was added to verify that requesting the first page returns the first two tasks.

The test initially failed because the first returned task was `Task 3` instead of `Task 1`.

The failure demonstrated that the pagination offset was being calculated incorrectly.

The route-level pagination test reproduced the same behavior through the HTTP API.

## Root Cause

The pagination implementation used a zero-based offset formula while accepting a 1-based page number.

The existing calculation:

```js
page * limit
```

effectively treated page 1 as the second page.

## Fix

The offset calculation was changed to:

```js
const offset = (page - 1) * limit;
```

This converts the 1-based page number into the correct zero-based array offset.

For example:

```text
Page 1:

(1 - 1) × 2 = 0

Page 2:

(2 - 1) × 2 = 2
```

## Verification

After applying the fix:

* The service-level pagination test passed.
* The route-level pagination test passed.
* The complete test suite passed.

---

# Verification Summary

Both bugs were first reproduced through automated tests, then fixed in the relevant service logic and verified through the complete test suite.

Final test result:

```text
Test Suites: 2 passed, 2 total
Tests:       49 passed, 49 total
Snapshots:   0 total
```

Final coverage:

```text
Statements: 97.41%
Branches:   98.82%
Functions:  93.33%
Lines:      97.18%
```

The final implementation exceeds the assignment's requirement of at least 80% test coverage. The test suite also includes regression coverage for both identified bugs, along with additional validation and edge-case tests for the API.
