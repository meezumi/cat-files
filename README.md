# Cat-Files - Zoho Catalyst Application

Cat-Files is a secure file collection application built on **Zoho Catalyst's** Serverless Logic and Data Store. It is designed for businesses to request documents from clients easily and securely.

## Live Application
- **App URL**: `https://files-60057482421.development.catalystserverless.in/app/`
<!-- - **Guest Portal**: `https://files-60057482421.development.catalystserverless.in/app/p/<REQUEST_ID>` -->
- **API Documentation**: [View API Docs](https://files-60057482421.development.catalystserverless.in/app/api/v1/documentation)

## Architecture

The application follows a **Monolithic Functions** architecture (per feature domain), splitting logic into specialized Advanced I/O functions to handle specific responsibilities. All data is stored in the **Catalyst Data Store**, and files are managed via the **Catalyst File Store**.

- **Frontend**: React (Vite) Single Page Application (SPA).
- **Backend**: Node.js Express Functions (Advanced I/O).
- **Database**: Zoho Catalyst Data Store (ZCQL).
- **Storage**: Zoho Catalyst File Store.

## Key Features

- **Request Management**: Create, send, and track document collection requests.
- **Email Notifications**: Automated guest links sent via email (with fallback popup).
- **Guest Portal**: Public-facing secure upload portal for recipients (No login required).
- **Organization Management**: Multi-user support with role-based access (Super Admin, Admin, Contributor, Viewer).
- **Workflow**: Approve, reject, or comment on uploaded documents.
- **Templates**: Save request structures for reuse.

---

# API Reference

For detailed API documentation, including request/response examples and testable snippets, please visit the **[Live API Documentation Page](https://files-60057482421.development.catalystserverless.in/app/api/v1/documentation)**.

### Core Functions
| Function Name | Description | Base URL |
| :--- | :--- | :--- |
| **files_function** | General file operations | `/server/files_function/` |
| **fetch_requests_function** | Retrieving data (Requests, Orgs, Contacts) | `/server/fetch_requests_function/` |
| **create_request_function** | Creating entities (Requests, Tags) | `/server/create_request_function/` |
| **upload_function** | Handling file uploads/downloads | `/server/upload_function/` |
| **user_auth** | Authentication & Session Management | `/server/user_auth/` |
| **org_function** | (Deprecating) Org specific logic | `/server/org_function/` |
| **workflow_function** | State transitions, Emails, Cron jobs | `/server/workflow_function/` |

## Data Schema
Tables used in Catalyst Data Store:
1.  **Requests**: Main entity containing subject, due date, status using status enum.
2.  **Sections**: Logical grouping of items within a request.
3.  **Items**: Individual checklist items/files to be uploaded.
4.  **ActivityLog**: Audit trail for all actions (Viewed, Uploaded, Completed).
5.  **Organisations**: Multitenancy root.
6.  **OrganisationMembers**: User-to-Org mapping with Roles.
7.  **Contacts**: Address book for frequent recipients.
8.  **Tags**: Labels for categorizing requests.
