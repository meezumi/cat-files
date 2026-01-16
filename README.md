# Cat-Files - Zoho Catalyst Application

Cat-Files is a secure file collection application built on **Zoho Catalyst's** Serverless Logic and Data Store. It is designed for businesses to request documents from clients easily and securely.

## Architecture

The application follows a **Monolithic Functions** architecture (per feature domain), splitting logic into specialized Advanced I/O functions to handle specific responsibilities. All data is stored in the **Catalyst Data Store**, and files are managed via the **Catalyst File Store**.

- **Frontend**: React (Vite) Single Page Application (SPA).
- **Backend**: Node.js Express Functions (Advanced I/O).
- **Database**: Zoho Catalyst Data Store (ZCQL).
- **Storage**: Zoho Catalyst File Store.

## Key Features

- **Request Management**: Create, send, and track document collection requests.
- **Guest Portal**: Public-facing secure upload portal for recipients.
- **Organization Management**: Multi-user support with role-based access.
- **Workflow**: Approve, reject, or comment on uploaded documents.

---

# API Reference

All backend functions are deployed as **Advanced I/O** functions. The base URL for each function is configured via the Catalyst Console (e.g., `/server/<function_name>/`).

## 1. Authentication Function (`auth_function`)
Handles user identity, session management, and organization context.

### A. Get Current User
*   **Endpoint**: `GET /me`
*   **Description**: Returns the authenticated user's details.
*   **Response**:
    ```json
    {
      "status": "success",
      "data": {
        "user_id": "671930455",
        "first_name": "John",
        "email_id": "john@example.com",
        "role_details": { "role_name": "App Admin" }
      }
    }
    ```

### B. Invite User
*   **Endpoint**: `POST /invite`
*   **Description**: Invites a new user to the Catalyst project/organization.
*   **Body**:
    ```json
    {
      "email": "jane@example.com",
      "first_name": "Jane",
      "last_name": "Doe"
    }
    ```

### C. Logout
*   **Endpoint**: `GET /logout`
*   **Description**: Redirects the user to the Catalyst logout URL.

---

## 2. Organization Function (`org_function`)
Manages organization details and member lists.

### A. List Members
*   **Endpoint**: `GET /:id/members`
*   **Description**: Retrieves a paginated list of users in the organization via REST API.
*   **Query Params**: `start` (default 1), `end` (default 20).
*   **Response**:
    ```json
    { "status": "success", "data": [ { "email_id": "..." } ] }
    ```

### B. Get Subscription
*   **Endpoint**: `GET /:id/subscription`
*   **Description**: (Mock) Returns current billing plan and quota usage.

---

## 3. Create Request Function (`create_request_function`)
Handles the creation of new document requests.

### A. Create Request
*   **Endpoint**: `POST /`
*   **Description**: Creates a new Request, Section, and Item hierarchy in the Data Store.
*   **Body**:
    ```json
    {
      "recipientName": "Client Name",
      "recipientEmail": "client@example.com",
      "subject": "Tax Documents",
      "dueDate": "2026-03-31",
      "items": [ { "title": "W2 Form", "type": "File" } ],
      "sections": [ { "title": "Income", "items": [...] } ]
    }
    ```
*   **Implementation**: Uses `insertRow` REST API for transactional integrity.

---

## 4. Fetch Requests Function (`fetch_requests_function`)
Retrieves request data for the Dashboard and Guest views.

### A. List Requests
*   **Endpoint**: `GET /`
*   **Description**: Lists requests with status filtering and pagination.
*   **Query Params**: 
    - `page` (number)
    - `status` (string): 'Draft', 'Sent', 'Completed', etc.
*   **Implementation**: Executes `ZCQL` queries via REST API.

### B. Get Request Details
*   **Endpoint**: `GET /:id`
*   **Description**: Fetches full request object with sections and items.
*   **Query Params**: `view=guest` (triggers status update to 'Seen').

---

## 5. Upload Function (`upload_function`)
Manages file uploads and links them to Request Items.

### A. Upload File
*   **Endpoint**: `POST /`
*   **Description**: Uploads a file to specific Folder ID and updates the Item's status to 'Uploaded'.
*   **Body**: `multipart/form-data` with `file` field.
*   **Query Params**: `itemId` (Optional: Links file to specific Item ID).
*   **Implementation**: Direct Catalyst File Store REST API upload.

### B. Download File
*   **Endpoint**: `GET /:id`
*   **Description**: Streams the file content to the client.

### C. Delete File
*   **Endpoint**: `DELETE /:id`
*   **Description**: Permanently deletes a file from key storage.

---

## 6. Workflow Function (`workflow_function`)
Manages the lifecycle and status of requests and items.

### A. Update Request Status
*   **Endpoint**: `PUT /requests/:id/status`
*   **Body**: `{ "status": "Archived" }`

### B. Update Item Status (Review)
*   **Endpoint**: `PUT /items/:id/status`
*   **Description**: Used by Admins to Approve or Reject a document.
*   **Body**:
    ```json
    {
      "status": "Returned",
      "feedback": "Image is blurry. Please re-upload."
    }
    ```

---

## Data Schema
Tables used in Catalyst Data Store:
1.  **Requests**: Main entity.
2.  **Sections**: Logical grouping of items.
3.  **Items**: Individual checklist items/files.
4.  **ActivityLog**: Audit trail for all actions.
