# Requirements Document

## Introduction

The Secure Admin Panel provides a fully protected administrative interface for the CyberForge Academy cybersecurity learning platform. The panel enables authorized administrators to manage all platform content including users, challenges, labs, tasks, announcements, and audit logs. The system implements multi-layer security including secret URL token gates, JWT authentication, role-based access control, rate limiting, and comprehensive audit logging. The admin panel follows the platform's cyberpunk dark theme with Orbitron font and red/cyan color palette.

## Glossary

- **Admin_Panel**: The administrative web interface accessible only to users with Admin_Role after passing multiple security gates
- **Secret_URL_Token**: A cryptographically random string required as the `access` query parameter to reveal the admin login form
- **JWT**: JSON Web Token used for stateless authentication after successful admin login
- **Admin_Role**: The `role: "admin"` designation stored in Firestore that grants administrative privileges
- **Audit_Log**: An immutable record of every administrative action containing actor username, action type, target entity type, target entity ID, and server timestamp
- **Rate_Limiter**: Express middleware that restricts the number of API requests from a single IP address within a configurable time window
- **Content_Entity**: Any platform resource managed via the Admin_Panel, including challenges, labs, tasks, users, and announcements
- **CRUD_Operation**: A create, read, update, or delete operation on a Content_Entity
- **Challenge**: A CTF-style problem with a required flag, optional hints, optional files, tags, difficulty rating, category, and point value
- **Lab**: A guided hands-on exercise containing ordered steps, required tools, learning objectives, and an XP reward value
- **Task**: A coding exercise with starter code, a reference solution, ordered test cases, and a difficulty rating
- **Step_Editor**: The Admin_Panel UI component for adding, editing, deleting, and reordering Lab steps
- **Honeypot_Log**: A Firestore document written by the honeypot middleware capturing source IP, target endpoint, user agent, timestamp, and any submitted payload
- **Leaderboard**: The ordered list of users ranked by XP points descending
- **Announcement**: A platform-wide broadcast message with author attribution and post timestamp
- **Input_Sanitizer**: The server-side and client-side validation layer that escapes or rejects potentially dangerous characters in user-supplied input
- **CSP_Header**: The Content-Security-Policy HTTP response header that instructs browsers to restrict resource loading to approved origins
- **Ban_Action**: An administrative operation that sets a target user's `status` field to `"banned"` or `"suspended"` in Firestore
- **XP**: Numeric experience points earned by users for completing challenges, labs, and tasks
- **Admin_Login_Endpoint**: The POST /api/auth/login HTTP endpoint used for credential verification
- **Self_Protection_Rule**: A server-side guard that prevents an admin from taking an action that would compromise administrative continuity

---

## Requirements

### Requirement 1: Secret URL Token Gate

**User Story:** As a platform administrator, I want the admin panel URL to be hidden behind a secret token, so that unauthorized users who discover the URL cannot reach the login interface.

#### Acceptance Criteria

1. WHEN a browser navigates to /admin.html without an `access` query parameter, THE Admin_Panel SHALL render a 404 error page with status code 404
2. WHEN a browser navigates to /admin.html with an `access` query parameter that does not match the configured Secret_URL_Token, THE Admin_Panel SHALL render a 404 error page
3. WHEN a browser navigates to /admin.html with a valid Secret_URL_Token in the `access` query parameter, THE Admin_Panel SHALL display the admin login form
4. THE Admin_Panel SHALL verify Secret_URL_Token values by sending a GET request to /api/admin-access/verify with the token as a query parameter before revealing the login form
5. IF the /api/admin-access/verify endpoint returns a non-success response or the network request fails, THEN THE Admin_Panel SHALL render a 404 error page

### Requirement 2: Multi-Layer Authentication

**User Story:** As a security-conscious platform owner, I want independent security layers so that bypassing one layer alone does not grant access.

#### Acceptance Criteria

1. WHEN a valid Secret_URL_Token is confirmed, THE Admin_Panel SHALL require username/password credential submission before granting access
2. THE Admin_Panel SHALL call the Admin_Login_Endpoint with submitted credentials and verify the response includes `role: "admin"`
3. IF the Admin_Login_Endpoint returns a success response but the user's role is not `"admin"`, THEN THE Admin_Panel SHALL reject the login with message "Access denied — admin account required"
4. THE Admin_Panel SHALL accept only a JWT signed with the platform's JWT_SECRET as proof of authentication for all subsequent API calls
5. WHEN a valid JWT with Admin_Role is stored in sessionStorage, THE Admin_Panel SHALL skip the login form on page load and render the admin interface directly

### Requirement 3: Stricter Rate Limiting on Admin Login

**User Story:** As a security engineer, I want strict rate limiting on the admin login endpoint, so that automated brute-force attacks cannot cycle through passwords.

#### Acceptance Criteria

1. THE Rate_Limiter SHALL allow a maximum of 5 requests per unique IP address per 15-minute window on the Admin_Login_Endpoint
2. IF a client sends more than 5 requests within a 15-minute window to the Admin_Login_Endpoint, THEN THE Rate_Limiter SHALL respond with HTTP 429 with message "Too many login attempts, please try again after 15 minutes"
3. WHEN a 15-minute window expires, THE Rate_Limiter SHALL reset the counter for that IP address to zero
4. THE Rate_Limiter applied to the Admin_Login_Endpoint SHALL be independent of the global API rate limiter

### Requirement 4: Admin Audit Logging

**User Story:** As a compliance officer, I want every administrative action recorded with full context, so that the audit trail is complete and attributable.

#### Acceptance Criteria

1. WHEN an admin performs any CRUD_Operation through the Admin_Panel, THE Admin_Panel SHALL create an Audit_Log entry in Firestore before returning the API response
2. THE Audit_Log entry SHALL contain the following fields: `adminId`, `adminUsername`, `action` (string), `entityType` (string), `entityId` (string or null), `details` (object with relevant metadata), and `timestamp` (Firestore server timestamp)
3. WHEN an admin executes a Ban_Action, THE Admin_Panel SHALL create an Audit_Log entry with `action: "ban_user"` and `details` containing the target username and ban type
4. WHEN an admin broadcasts an Announcement, THE Admin_Panel SHALL create an Audit_Log entry with `action: "broadcast_announcement"` and `details` containing the message text
5. THE Admin_Panel SHALL store all Audit_Log entries in a Firestore collection named `"admin_audit_logs"`
6. THE Admin_Panel SHALL provide a read-only Audit_Log viewer accessible from the sidebar navigation, displaying entries sorted by timestamp descending

### Requirement 5: Challenge Management — Full CRUD

**User Story:** As a content administrator, I want full CRUD capabilities for challenges with all metadata fields, so that I can build and maintain the CTF challenge library.

#### Acceptance Criteria

1. THE Admin_Panel SHALL provide a challenge creation form with fields: title (required), description (required), category (required, one of: web, cryptography, forensics, reverse-engineering, pwn, osint, network, steganography, misc), difficulty (required, one of: easy, medium, hard, insane), points (required, positive integer), flag (required), hints (repeatable: text, cost), files (repeatable: name, url), tags (comma-separated), writeup (optional)
2. WHEN an admin submits a valid challenge creation form, THE Admin_Panel SHALL POST to /api/admin/challenges and display the new challenge in the table
3. THE Admin_Panel SHALL display all challenges in a table with columns: title, category, difficulty, points, solve count, active status, created date
4. WHEN an admin clicks the edit button on a challenge row, THE Admin_Panel SHALL open a form pre-populated with all existing challenge field values
5. WHEN an admin submits a valid challenge update form, THE Admin_Panel SHALL PUT to /api/admin/challenges/:id and update the table row
6. WHEN an admin confirms deletion of a challenge, THE Admin_Panel SHALL DELETE /api/admin/challenges/:id and remove the row from the table
7. IF the flag field is empty when submitting a challenge form, THEN THE Admin_Panel SHALL display validation error "Flag is required" and reject the submission

### Requirement 6: Lab Management — Full CRUD with Step Editor

**User Story:** As a content administrator, I want full CRUD capabilities for labs including an inline step editor, so that I can create and maintain detailed guided lab exercises.

#### Acceptance Criteria

1. THE Admin_Panel SHALL provide a lab creation form with fields: title (required), description (required), category (required, one of: kali-basics, network-scan, web-hacking, password-cracking, malware-analysis, forensics, exploitation), difficulty (required, one of: beginner, intermediate, advanced), duration (required), xpReward (required, positive integer), tools (comma-separated), objectives (comma-separated)
2. THE Step_Editor SHALL allow adding steps with fields: title (required), instruction (required), command (optional), expectedOutput (optional), hint (optional)
3. THE Step_Editor SHALL automatically assign sequential stepNumber values starting from 1
4. WHEN an admin deletes a step, THE Step_Editor SHALL renumber remaining steps sequentially starting from 1
5. WHEN an admin reorders steps using up/down buttons, THE Step_Editor SHALL update stepNumber values to reflect the new order
6. WHEN an admin submits a valid lab creation form, THE Admin_Panel SHALL POST to /api/admin/labs with all step data embedded
7. WHEN an admin submits a valid lab update form, THE Admin_Panel SHALL PUT to /api/admin/labs/:id with updated fields and steps
8. WHEN an admin confirms deletion of a lab, THE Admin_Panel SHALL DELETE /api/admin/labs/:id and remove the row from the table

### Requirement 7: Task Management — Full CRUD

**User Story:** As a content administrator, I want full CRUD capabilities for coding tasks including test case management, so that I can maintain a comprehensive programming exercise library.

#### Acceptance Criteria

1. THE Admin_Panel SHALL provide a task creation form with fields: title (required), description (required), type (required, one of: python, bash, c, javascript, sql-injection, xss, buffer-overflow), difficulty (required, one of: easy, medium, hard), points (required, positive integer), starterCode (optional), solution (required), hints (repeatable), tags (comma-separated)
2. THE Admin_Panel SHALL provide a test case editor allowing addition, editing, and deletion of test cases with fields: input (required), expectedOutput (required), isHidden (checkbox)
3. WHEN an admin submits a valid task creation form, THE Admin_Panel SHALL POST to /api/admin/tasks with all test cases embedded
4. THE Admin_Panel SHALL display all tasks in a table with columns: title, type, difficulty, points, completion count, active status
5. WHEN an admin submits a valid task update form, THE Admin_Panel SHALL PUT to /api/admin/tasks/:id with updated fields and test cases
6. WHEN an admin confirms deletion of a task, THE Admin_Panel SHALL DELETE /api/admin/tasks/:id and remove the row from the table

### Requirement 8: User Management — Edit Role, XP, and Rank

**User Story:** As a platform administrator, I want to edit user roles, XP values, and rank titles, so that I can correct data errors and recognize exceptional contributions.

#### Acceptance Criteria

1. THE Admin_Panel SHALL display all users in a table with columns: username, email, role, XP, level, rank, status, joined date
2. THE Admin_Panel SHALL provide a text search input that filters the user table in real time by username or email
3. WHEN an admin clicks the edit button on a user row, THE Admin_Panel SHALL display a modal with editable fields: role (select: student, instructor, admin), XP (non-negative integer)
4. WHEN an admin submits a valid user edit form, THE Admin_Panel SHALL PUT to /api/admin/users/:id with the updated role and XP values
5. THE Admin_Panel SHALL display the updated user data in the table row after a successful save

### Requirement 9: User Management — Ban and Suspend

**User Story:** As a moderator, I want to ban or suspend accounts that violate platform policies, so that I can maintain a safe learning environment.

#### Acceptance Criteria

1. THE Admin_Panel SHALL provide a "Ban" and "Suspend" action button on each user row in the user management table
2. WHEN an admin clicks "Ban User", THE Admin_Panel SHALL display a confirmation dialog with the target username
3. WHEN the ban is confirmed, THE Admin_Panel SHALL PUT to /api/admin/users/:id/ban which sets the user's `status` to `"banned"` and `bannedAt` to the current server timestamp
4. WHEN an admin confirms a suspend action, THE Admin_Panel SHALL PUT to /api/admin/users/:id/suspend which sets the user's `status` to `"suspended"`
5. WHEN a Ban_Action is executed, THE Admin_Panel SHALL create an Audit_Log entry with the target user ID and action type

### Requirement 10: Self-Protection Rules

**User Story:** As a system architect, I want built-in guards preventing administrators from accidentally locking out all admin access, so that the platform remains administrable.

#### Acceptance Criteria

1. IF an admin sends a DELETE request for their own user ID, THEN THE Admin_Panel backend SHALL reject the request with HTTP 400 and message "Cannot delete yourself"
2. IF an admin sends a role update request that would change the last remaining admin user to a non-admin role, THEN THE Admin_Panel backend SHALL reject the request with HTTP 400 and message "Cannot demote the last administrator"
3. THE Admin_Panel backend SHALL count users with `role: "admin"` before processing any role change request that would reduce the admin count
4. THE Admin_Panel SHALL disable the delete and demote actions in the UI for the currently authenticated admin's own row

### Requirement 11: Dashboard with Platform Statistics

**User Story:** As a platform owner, I want a dashboard with key metrics and recent activity at a glance, so that I can monitor platform health efficiently.

#### Acceptance Criteria

1. THE Admin_Panel SHALL display stat cards for: total user count, total challenge count, total lab count, total task count
2. THE Admin_Panel SHALL fetch all statistics from a single GET /api/admin/stats request
3. THE Admin_Panel SHALL display a "Recent Registrations" table with the 5 most recently created users showing: username, role, XP, joined date
4. THE Admin_Panel SHALL display a "Top Players" table with the 5 users with highest XP showing: position medal/number, username, XP, rank title
5. WHEN the dashboard section is activated, THE Admin_Panel SHALL refresh statistics by making a new request to /api/admin/stats

### Requirement 12: Platform Announcements

**User Story:** As a platform administrator, I want to broadcast messages to all users, so that I can communicate platform updates and events.

#### Acceptance Criteria

1. THE Admin_Panel SHALL provide an announcement section with a text area field for the message body (maximum 2000 characters) and a submit button
2. WHEN an admin submits an announcement, THE Admin_Panel SHALL POST to /api/admin/announce with the message text
3. THE Admin_Panel SHALL display the most recently posted announcement with its author username and posted timestamp
4. THE Admin_Panel SHALL create an Audit_Log entry when an announcement is broadcast
5. IF the message field is empty or contains only whitespace, THEN THE Admin_Panel SHALL display validation error "Announcement message cannot be empty" and reject the submission

### Requirement 13: Honeypot Logs Viewer

**User Story:** As a security analyst, I want to view honeypot trap records, so that I can identify attack patterns and malicious actors.

#### Acceptance Criteria

1. THE Admin_Panel SHALL provide a "Honeypot Logs" view accessible from the sidebar navigation
2. THE Admin_Panel SHALL fetch honeypot log data from GET /api/admin/honeypot-logs with pagination parameters
3. THE Admin_Panel SHALL display honeypot logs in a table with columns: timestamp, source IP, endpoint accessed, HTTP method, user agent
4. THE Admin_Panel SHALL load 50 log entries per page and provide previous/next pagination controls
5. THE Admin_Panel SHALL display the total number of honeypot log entries above the table

### Requirement 14: Input Sanitization and Validation

**User Story:** As a security engineer, I want all inputs sanitized and validated on both client and server, so that injection and XSS attacks cannot compromise stored data.

#### Acceptance Criteria

1. THE Input_Sanitizer SHALL escape the HTML special characters `<`, `>`, `"`, `'`, and `&` in all text fields before writing to Firestore
2. THE Input_Sanitizer SHALL reject any input that contains `<script`, `javascript:`, `on\w+=`, or `<iframe` patterns and return HTTP 400 with message "Invalid input detected"
3. THE Admin_Panel SHALL validate that required fields are non-empty and display per-field error messages for missing required values
4. THE Admin_Panel SHALL validate that numeric fields (XP, points, xpReward) contain non-negative integers and reject non-numeric input
5. THE Admin_Panel SHALL validate email format using a standard email regex pattern before submitting user edit requests
6. THE Admin_Panel SHALL trim leading and trailing whitespace from all text inputs before validation and storage

### Requirement 15: Content Security Policy Headers

**User Story:** As a security engineer, I want strict CSP headers on admin routes, so that the XSS attack surface is limited.

#### Acceptance Criteria

1. THE Admin_Panel backend SHALL apply a Content-Security-Policy response header to all /api/admin/* route responses
2. THE CSP_Header SHALL include `default-src 'self'`
3. THE CSP_Header SHALL include `script-src 'self' https://cdnjs.cloudflare.com https://fonts.googleapis.com`
4. THE CSP_Header SHALL include `style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com`
5. THE CSP_Header SHALL include `frame-ancestors 'none'`

### Requirement 16: Leaderboard Management

**User Story:** As a platform administrator, I want to view the leaderboard and trigger rank recalculation, so that I can verify rankings are accurate.

#### Acceptance Criteria

1. THE Admin_Panel SHALL provide a "Leaderboard" view accessible from the sidebar navigation
2. THE Admin_Panel SHALL display all users sorted by XP descending with columns: position, username, XP, level, rank title, badges count
3. THE Admin_Panel SHALL provide a "Recalculate Ranks" button that POST to /api/admin/recalculate-ranks
4. WHEN rank recalculation is triggered, THE Admin_Panel SHALL create an Audit_Log entry with `action: "recalculate_leaderboard"`

### Requirement 17: Cyberpunk Dark Theme Consistency

**User Story:** As a UX designer, I want the admin panel to use the same cyberpunk visual language as the main platform, so that administrators have a cohesive experience.

#### Acceptance Criteria

1. THE Admin_Panel SHALL use the Orbitron font family for all headings, logos, and monospace display values
2. THE Admin_Panel SHALL apply the following color tokens: background `#050a0f`, card background `#0a1520`, primary accent `#ff0040` (red), secondary accent `#00d4ff` (cyan), tertiary accent `#ff6600` (orange)
3. THE Admin_Panel SHALL use a sticky top navbar with height 62px and a bottom border of `1px solid #2a0a0a`
4. THE Admin_Panel SHALL use the same button pattern as the main platform: gradient backgrounds, uppercase lettering, hover glow effects
5. THE Admin_Panel SHALL use dark input fields with `border: 1px solid #1a3a5a` resting state and `border-color: #ff0040` focus state

### Requirement 18: Session Management

**User Story:** As an administrator, I want my authenticated session to persist through page refreshes, so that I do not have to log in repeatedly during the same browser session.

#### Acceptance Criteria

1. WHEN an admin successfully authenticates, THE Admin_Panel SHALL store the JWT in sessionStorage under key `"admin_jwt"`
2. WHEN the admin panel page loads and a Secret_URL_Token is present, THE Admin_Panel SHALL retrieve the JWT from sessionStorage
3. IF a JWT is found in sessionStorage, THE Admin_Panel SHALL verify it by calling GET /api/auth/me with the token as a Bearer header
4. IF the /api/auth/me response confirms `role: "admin"`, THE Admin_Panel SHALL skip the login form and render the admin interface
5. WHEN an admin clicks logout, THE Admin_Panel SHALL delete `"admin_jwt"` from sessionStorage and redirect to index.html

### Requirement 19: Error Handling and User Feedback

**User Story:** As an administrator, I want clear immediate feedback on every action, so that I know whether operations succeeded or failed without checking the network tab.

#### Acceptance Criteria

1. WHEN an API call returns `success: true`, THE Admin_Panel SHALL display a green toast notification with a relevant success message for 3 seconds
2. WHEN an API call returns `success: false` or a network error occurs, THE Admin_Panel SHALL display a red toast notification with the error message for 3 seconds
3. WHEN a form submission fails client-side validation, THE Admin_Panel SHALL display inline error text below the relevant input field
4. WHILE an API request is in progress, THE Admin_Panel SHALL disable the triggering button and display a spinner icon inside it
5. WHEN the API request completes, THE Admin_Panel SHALL re-enable the triggering button and restore its original label

### Requirement 20: Sidebar Navigation

**User Story:** As an administrator, I want a persistent sidebar for navigating between panel sections, so that switching contexts is fast and the current section is always visible.

#### Acceptance Criteria

1. THE Admin_Panel SHALL display a sticky left sidebar containing navigation items: Dashboard, Users, Challenges, Labs, Tasks, Announce, Leaderboard, Honeypot Logs, Audit Log
2. WHEN a sidebar item is clicked, THE Admin_Panel SHALL apply an `active` CSS class to that item and load the corresponding view into the main content area
3. THE Admin_Panel SHALL display each navigation item with a Font Awesome icon and a text label
4. THE Admin_Panel SHALL show the current Secret_URL_Token at the bottom of the sidebar in a small monospace display for reference
5. THE Admin_Panel SHALL keep the sidebar visible and sticky while the main content area scrolls independently
