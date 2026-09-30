# Final Submission Notes

## What I Would Test Next

If I had more time, I would expand the test suite around input validation, pagination boundaries, and API error handling.

Some useful additional tests would include:

* Pagination with `page = 1` and different limits.
* Pagination when the requested page is beyond the available data.
* Pagination with invalid or negative page and limit values.
* Filtering when multiple query parameters are provided together.
* Creating tasks with invalid dates, priorities, and statuses.
* Updating tasks with invalid field values.
* Completing an already completed task.
* Assigning a task with non-string values such as numbers, `null`, or objects.
* Reassigning a task multiple times.
* Verifying that unexpected server errors are returned through the global error handler.
* Testing API behavior with malformed JSON requests.

I would also add tests for the behavior expected when multiple filters are combined, such as status filtering together with pagination.

## What Surprised Me

The main surprise was that some of the existing service logic looked correct at first glance but behaved incorrectly at the boundaries.

The status filter used `includes()`, which is easy to overlook because it works correctly for normal complete status values. However, it also allowed partial values to match.

The pagination issue was similarly subtle. The implementation used a normal-looking `page * limit` calculation, but because the API uses 1-based page numbers, the first page started at the wrong array index.

Writing tests before changing the implementation made both issues much easier to reproduce and understand.

Another useful observation was that integration tests helped verify that the service behavior was also exposed correctly through the HTTP routes rather than only working in isolation.

## Questions I Would Ask Before Production

Before putting this API into production, I would clarify a few requirements:

1. **Pagination validation**

   * What should happen when `page` or `limit` is zero, negative, non-numeric, or extremely large?
   * Should invalid values return `400`, or should the API use defaults?

2. **Task update semantics**

   * Is `PUT /tasks/:id` intended to be a full replacement or a partial update?
   * Should fields omitted from a PUT request be removed/reset?

3. **Task assignment**

   * Should an existing assignment always be replaceable?
   * Should assignees be validated against users stored in the system?

4. **Task status rules**

   * Are all status transitions allowed, or should transitions such as `done → todo` be restricted?

5. **Due dates**

   * Should past due dates be allowed when creating or updating tasks?
   * Should date handling be standardized to UTC?

6. **API error handling**

   * What error format should clients rely on?
   * Should unexpected errors expose a request or correlation ID for debugging?

7. **Data persistence**

   * The current service stores tasks in memory. What database and persistence strategy should be used in production?

8. **Concurrency**

   * How should simultaneous updates to the same task be handled?

9. **Authentication and authorization**

   * Who is allowed to create, update, delete, complete, or assign tasks?
   * Should users only be able to modify tasks they own?

10. **Observability**

    * What logging, monitoring, metrics, and alerting are required before production deployment?
