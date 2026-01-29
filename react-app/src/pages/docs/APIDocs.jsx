import React, { useState } from 'react';
import { Book, Copy } from 'lucide-react';
import styles from './APIDocs.module.css';

const endpoints = [
    {
        category: "Authentication",
        items: [
            { name: "Get Current User", method: "GET", path: "/server/user_auth/me", desc: "Retrieve currently logged-in user details." },
            { name: "Invite User (Auth)", method: "POST", path: "/server/user_auth/invite", desc: "Invite a new user to the platform." },
            { name: "Logout", method: "GET", path: "/server/user_auth/logout", desc: "Sign out the current user (Redirects)." }
        ]
    },
    {
        category: "Requests",
        items: [
            { name: "List Requests", method: "GET", path: "/server/fetch_requests_function/?page=1&per_page=10&status=all&search=", desc: "Fetch paginated list of requests." },
            { name: "Get Request", method: "GET", path: "/server/fetch_requests_function/:id", desc: "Get full details including sections and items." },
            { name: "Create Request", method: "POST", path: "/server/create_request_function/", desc: "Create a new Data Collection Request." },
            { name: "List Tags", method: "GET", path: "/server/create_request_function/tags", desc: "Retrieve all available tags." },
            { name: "Create Tag", method: "POST", path: "/server/create_request_function/tags", desc: "Create a new tag." }
        ]
    },
    {
        category: "Workflow",
        items: [
            { name: "Batch Update Status", method: "POST", path: "/server/workflow_function/requests/batch-status", desc: "Update multiple requests (e.g. Archive, Trash)." },
            { name: "Update Request Details", method: "PUT", path: "/server/workflow_function/requests/:id", desc: "Update general details like Due Date." },
            { name: "Update Request Status", method: "PUT", path: "/server/workflow_function/requests/:id/status", desc: "Update status (e.g., 'Sent', 'Completed')." },
            { name: "Add CC Recipient", method: "POST", path: "/server/workflow_function/requests/:id/cc", desc: "Add a CC recipient to the request." },
            { name: "Send Reminder", method: "POST", path: "/server/workflow_function/requests/:id/remind", desc: "Trigger an email reminder to the recipient." },
            { name: "Update Item Status", method: "PUT", path: "/server/workflow_function/items/:id/status", desc: "Approve or Reject specific items." },
            { name: "Empty Trash", method: "DELETE", path: "/server/workflow_function/trash", desc: "Permanently delete all requests in Trash." }
        ]
    },
    {
        category: "Organisations",
        items: [
            { name: "List Orgs", method: "GET", path: "/server/fetch_requests_function/orgs", desc: "List organisations related to the user." },
            { name: "Create Org", method: "POST", path: "/server/fetch_requests_function/orgs", desc: "Create a new Organisation." },
            { name: "Update Org", method: "PUT", path: "/server/fetch_requests_function/orgs/:id", desc: "Update Organisation details." },
            { name: "Delete Org", method: "DELETE", path: "/server/fetch_requests_function/orgs/:id", desc: "Remove an Organisation." }
        ]
    },
    {
        category: "Org Members",
        items: [
            { name: "List Members", method: "GET", path: "/server/fetch_requests_function/orgs/:id/members", desc: "List members of an organisation." },
            { name: "Add Member", method: "POST", path: "/server/fetch_requests_function/orgs/:id/members", desc: "Add a member to an organisation." },
            { name: "Update Member Role", method: "PUT", path: "/server/fetch_requests_function/orgs/:id/members/:memberId", desc: "Update a member's role." },
            { name: "Remove Member", method: "DELETE", path: "/server/fetch_requests_function/orgs/:id/members/:memberId", desc: "Remove a member from the organisation." }
        ]
    },
    {
        category: "Contacts",
        items: [
            { name: "List Contacts", method: "GET", path: "/server/fetch_requests_function/orgs/:id/contacts", desc: "List contacts within an organisation." },
            { name: "Create Contact", method: "POST", path: "/server/fetch_requests_function/orgs/:id/contacts", desc: "Add a new contact to an organisation." },
            { name: "Update Contact", method: "PUT", path: "/server/fetch_requests_function/orgs/contacts/:id", desc: "Update contact details." },
            { name: "Delete Contact", method: "DELETE", path: "/server/fetch_requests_function/orgs/contacts/:id", desc: "Delete a contact." }
        ]
    },
    {
        category: "Files",
        items: [
            { name: "Upload File", method: "POST", path: "/server/upload_function/", desc: "Upload a file to a specific Item." },
            { name: "Download File", method: "GET", path: "/server/upload_function/:id", desc: "Download a specific file." }
        ]
    }
];

const getExampleBody = (item) => {
    if (item.path.includes('create_request_function/tags')) {
        return { name: "New Tag", color: "#FF5733" };
    }
    if (item.name === "Create Request") {
        return {
            recipientName: "John Doe",
            recipientEmail: "john@example.com",
            subject: "Tax Documents",
            message: "Please upload.",
            dueDate: "2024-12-31",
            status: "Draft",
            tags: ["TAG_ID_1"],
            sections: [
                { title: "Personal Info", items: [{ title: "ID Card", type: "file" }] }
            ]
        };
    }
    if (item.name === "Batch Update Status") {
        return { ids: ["REQ_ID_1", "REQ_ID_2"], status: "Archived" };
    }
    if (item.name === "Add CC Recipient") {
        return { name: "Jane Doe", email: "jane@example.com" };
    }
    if (item.name === "Update Request Status") {
        return { status: "Completed" };
    }
    if (item.name === "Update Request Details") {
        return { dueDate: "2025-01-01" };
    }
    if (item.name === "Create Org") {
        return { Name: "Acme Corp", Domain: "acme.com" };
    }
    if (item.name === "Add Member") {
        return { targetUserId: "USER_ID", role: "Contributor", email: "user@example.com" }; // Email usually looked up, but mostly userID needed
    }
    if (item.name === "Create Contact") {
        return { Name: "Client One", Email: "client@example.com", Role: "Client" };
    }
    if (item.method === 'POST' || item.method === 'PUT') {
        return { key: "value" };
    }
    return null;
};

const APIDocs = () => {
    const [activeCategory, setActiveCategory] = useState(endpoints[0].category);
    const [activeEndpoint, setActiveEndpoint] = useState(endpoints[0].items[0]);

    return (
        <div className={styles.container}>
            <aside className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    <Book size={24} color="var(--color-primary)" />
                    <h2>API Reference</h2>
                </div>
                <nav className={styles.nav}>
                    {endpoints.map(cat => (
                        <div key={cat.category} className={styles.category}>
                            <h3 onClick={() => setActiveCategory(cat.category)} className={activeCategory === cat.category ? styles.activeCat : ''}>
                                {cat.category}
                            </h3>
                            {activeCategory === cat.category && (
                                <ul className={styles.endpointList}>
                                    {cat.items.map(item => (
                                        <li
                                            key={item.name}
                                            className={`${styles.navItem} ${activeEndpoint === item ? styles.activeItem : ''}`}
                                            onClick={() => setActiveEndpoint(item)}
                                        >
                                            <span className={`${styles.methodBadge} ${styles[item.method]}`}>{item.method}</span>
                                            {item.name}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ))}
                </nav>
            </aside>

            <main className={styles.main}>
                <div className={styles.header}>
                    <h1>{activeEndpoint.name}</h1>
                    <p>{activeEndpoint.desc}</p>
                </div>

                <div className={styles.endpointBar}>
                    <span className={`${styles.methodBadgeLarge} ${styles[activeEndpoint.method]}`}>{activeEndpoint.method}</span>
                    <code className={styles.url}>{activeEndpoint.path}</code>
                </div>

                <div className={styles.section}>
                    <h3>Example Request</h3>
                    <div className={styles.codeBlock}>
                        <div className={styles.codeHeader}>
                            <span>JavaScript (Fetch)</span>
                            <button
                                className={styles.copyBtn}
                                onClick={() => {
                                    const code = `fetch('${activeEndpoint.path.replace(':id', '12345').replace(':memberId', '67890')}', {
    method: '${activeEndpoint.method}',
    headers: {
        'Content-Type': 'application/json'
    }${getExampleBody(activeEndpoint) ? `,
    body: JSON.stringify(${JSON.stringify(getExampleBody(activeEndpoint), null, 4).replace(/\n/g, '\n    ')})` : ''}
})
.then(response => response.json())
.then(data => console.log(data));`;
                                    navigator.clipboard.writeText(code);
                                    alert('Copied to clipboard!');
                                }}
                            >
                                <Copy size={14} /> Copy
                            </button>
                        </div>
                        <pre>
                            {`fetch('${activeEndpoint.path.replace(':id', '12345').replace(':memberId', '67890')}', {
    method: '${activeEndpoint.method}',
    headers: {
        'Content-Type': 'application/json'
    }${getExampleBody(activeEndpoint) ? `,
    body: JSON.stringify(${JSON.stringify(getExampleBody(activeEndpoint), null, 4).replace(/\n/g, '\n    ')})` : ''}
})
.then(response => response.json())
.then(data => console.log(data));`}
                        </pre>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default APIDocs;
