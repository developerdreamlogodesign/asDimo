import React from 'react';
import { useNavigate } from 'react-router-dom';
import Table from '../../ui/Table.tsx';
import Loader from '../../ui/Loaders';
import DashboardButtons from '../../ui/Buttons';
import { routes } from '../../../routes/AppRoutes';
import { tokenManager } from '../../../services/tokenManager';
import IButton from "../../../assets/Images/iButton.svg";


interface ZonalAdminTableProps {
  rows: Array<{
    zonaladminname: string;
    location: string;
    numberadmins: number;
    numberorganizations: number;
    numbertherapists: number;
    numbersubscriptions: number;
    numberpes: number;
    userId: string | number;
  }>;
  loading?: boolean;
}

const ZonalAdminTable: React.FC<ZonalAdminTableProps> = ({ rows, loading = false }) => {
  const navigate = useNavigate();
  const currentUser = tokenManager.getUser();
  const userFlag = Number(currentUser?.flag) || 0;

  const handleViewDetails = (userId: string | number) => {
    // Keep the id in the URL as well as navigation state so this profile can
    // be opened directly or refreshed without losing the selected user.
    navigate(`${routes.SUP_ZONALADMIN_DETAILS}?userId=${encodeURIComponent(String(userId))}`, {
      state: { userId },
    });
  };

  const allColumns = [
    {
      key: 'zonaladminname',
      title: 'Name',
    },
    {
      key: 'location',
      title: 'Location',
    },
    {
      key: 'numberadmins',
      title: 'Admins',
    },
    {
      key: 'numberorganizations',
      title: 'Organizations',
    },
    // {
    //   key: 'numbertherapists',
    //   title: 'Therapists',
    // },
    {
      key: 'numberParents',
      title: 'Users',
    },
    {
      key: 'numberAppointments',
      title: 'Appointments',
    },
    {
      key: 'numbertherapists',
      title: 'Therapists',
    },
    {
      key: 'numbersubscriptions',
      title: 'Subscriptions',
    },
    {
      key: 'numberpes',
      title: 'PE',
    },
    {
      key: "action",
      title: "Action",
      render: (_: any, row: any) => (
        <DashboardButtons
          className="appointment_view"
          text="View Details"
          icon={<img src={IButton} alt="view" className="btn-icon" />}
          variant="trashparent"
          onClick={() => handleViewDetails(row.userId)}
        />
      ),
    },
  ];

  // Filter columns based on user flag
  const columns = allColumns.filter(col => {
    if (userFlag === 6 && col.key === 'numberadmins') {
      return false;
    }
    if (userFlag === 6 && col.key === 'numberParents') {
      return false;
    }
    if (userFlag === 6 && col.key === 'numberAppointments') {
      return false;
    }
    if (userFlag === 7 && col.key === 'numberadmins') {
      return false;
    }
    if (userFlag === 7 && col.key === 'numberParents') {
      return false;
    }
    if (userFlag === 7 && col.key === 'numberAppointments') {
      return false;
    }
    if (userFlag === 1 && col.key === 'numberorganizations') {
      return false;
    }
    if (userFlag === 1 && col.key === 'numbertherapists') {
      return false;
    }
    if (userFlag === 1 && col.key === 'numberadmins') {
      return false;
    }
    if (userFlag === 7 && col.key === 'numberorganizations') {
      return false;
    }
    if (userFlag === 3 && col.key === 'numbertherapists') {
      return false;
    }
    if (userFlag === 3 && col.key === 'numberParents') {
      return false;
    }
    if (userFlag === 3 && col.key === 'numberAppointments') {
      return false;
    }
    if (userFlag === 5 && col.key === 'numberorganizations') {
      return false;
    }
    if (userFlag === 0 && col.key === 'numberParents') {
      return false;
    }
    if (userFlag === 0 && col.key === 'numberAppointments') {
      return false;
    }
    if (userFlag === 0 && col.key === 'numbertherapists') {
      return false;
    }
    return true;
  });

  if (loading) {
    return <Loader />;
  }

  return (
    <>
      <Table columns={columns} rows={rows} pagination displayLimit={8} selectable />
    </>
  );
};

export default ZonalAdminTable;
