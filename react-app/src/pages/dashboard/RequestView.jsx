import React from 'react';
import RequestList from '../../components/dashboard/RequestList';

const RequestView = ({ title, filterStatus }) => {
    return (
        <div>
            <h1 style={{ fontSize: '24px', marginBottom: '24px', fontWeight: 600 }}>{title}</h1>
            <RequestList filterStatus={filterStatus} />
        </div>
    );
};

export default RequestView;
